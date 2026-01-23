import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as searchGET } from '../app/api/search/route.js';
import { POST as addPOST } from '../app/api/add/route.js';
import * as qbittorrent from '../src/lib/qbittorrent';

// Mock dependencies
vi.mock('../src/lib/config', () => ({
  readMamToken: vi.fn(() => 'test-mam-token-12345'),
  config: { 
    qbUrl: 'http://localhost:8080', 
    qbUser: 'testuser', 
    qbPass: 'testpass', 
    qbCategory: 'books',
    mamTokenFile: 'secrets/mam_api_token'
  }
}));

vi.mock('../src/lib/qbittorrent', () => ({
  qbLogin: vi.fn(),
  qbAddUrl: vi.fn()
}));

global.fetch = vi.fn();

describe('Dual-Fetch Feature Tests', () => {
  let mockBookResponse;
  let mockAudiobookResponse;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default book search response
    mockBookResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'book-1',
            dl: 'book-download-link-1',
            title: 'Test Book 1',
            size: '2.5 MB',
            filetype: 'epub',
            added: '2025-09-25',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Book Author 1"}',
            seeders: 15,
            leechers: 3,
            times_completed: 25
          },
          {
            id: 'book-2',
            dl: 'book-download-link-2',
            title: 'Test Book 2',
            size: '1.8 MB',
            filetype: 'pdf',
            added: '2025-09-24',
            vip: 1,
            my_snatched: 0,
            author_info: '{"author":"Book Author 2"}',
            seeders: 8,
            leechers: 1,
            times_completed: 12
          }
        ]
      }),
      text: async () => ""
    };

    // Default audiobook search response
    mockAudiobookResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'audio-1',
            dl: 'audiobook-download-link-1',
            title: 'Test Audiobook 1',
            size: '450 MB',
            filetype: 'm4b',
            added: '2025-09-23',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Audio Author 1"}',
            seeders: 10,
            leechers: 2,
            times_completed: 15
          },
          {
            id: 'audio-2',
            dl: 'audiobook-download-link-2',
            title: 'Test Audiobook 2',
            size: '380 MB',
            filetype: 'mp3',
            added: '2025-09-22',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Audio Author 2"}',
            seeders: 5,
            leechers: 1,
            times_completed: 8
          }
        ]
      }),
      text: async () => ""
    };

    // Default qBittorrent mocks
    qbittorrent.qbLogin.mockResolvedValue('test-session-cookie');
    qbittorrent.qbAddUrl.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Parallel Search Functionality', () => {
    it('should search both books and audiobooks simultaneously with valid query', async () => {
      // Setup mock responses for both categories
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search books category
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      // Search audiobooks category
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      // Verify both searches succeeded
      expect(bookSearchRes.status).toBe(200);
      expect(audioSearchRes.status).toBe(200);

      // Verify book results
      expect(bookSearchData.results).toHaveLength(2);
      expect(bookSearchData.results[0].id).toBe('book-1');
      expect(bookSearchData.results[0].title).toBe('Test Book 1');
      expect(bookSearchData.results[0].filetypes).toBe('epub');

      // Verify audiobook results
      expect(audioSearchData.results).toHaveLength(2);
      expect(audioSearchData.results[0].id).toBe('audio-1');
      expect(audioSearchData.results[0].title).toBe('Test Audiobook 1');
      expect(audioSearchData.results[0].filetypes).toBe('m4b');

      // Verify both API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial search failure (books succeed, audiobooks fail)', async () => {
      // Setup: books succeed, audiobooks fail
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Server Error'
        });

      // Search books (should succeed)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toHaveLength(2);

      // Search audiobooks (should fail)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(502);
      expect(audioSearchData.results).toEqual([]);
      expect(audioSearchData.error).toContain('Search failed: 500');
    });

    it('should handle partial search failure (audiobooks succeed, books fail)', async () => {
      // Setup: audiobooks succeed, books fail with token expiration
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'You are not signed in'
        })
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search books (should fail with token expiration)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(401);
      expect(bookSearchData.tokenExpired).toBe(true);
      expect(bookSearchData.error).toContain('MAM token has expired');

      // Search audiobooks (should succeed)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(200);
      expect(audioSearchData.results).toHaveLength(2);
    });

    it('should handle both searches failing', async () => {
      // Setup: both searches fail
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Server Error'
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => 'Service Unavailable'
        });

      // Search books (should fail)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(502);
      expect(bookSearchData.results).toEqual([]);

      // Search audiobooks (should fail)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(502);
      expect(audioSearchData.results).toEqual([]);
    });

    it('should handle empty results for one category', async () => {
      // Setup: books return results, audiobooks return empty
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ error: 'No results found' }),
          text: async () => ""
        });

      // Search books (should have results)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toHaveLength(2);

      // Search audiobooks (should be empty)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(200);
      expect(audioSearchData.results).toEqual([]);
    });

    it('should handle empty results for both categories', async () => {
      // Setup: both searches return empty results
      const emptyResponse = {
        ok: true,
        status: 200,
        json: async () => ({ error: 'No results found' }),
        text: async () => ""
      };

      global.fetch
        .mockResolvedValueOnce(emptyResponse)
        .mockResolvedValueOnce(emptyResponse);

      // Search both categories
      const bookSearchReq = { url: 'http://localhost/api/search?q=nonexistent&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=nonexistent&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toEqual([]);
      expect(audioSearchRes.status).toBe(200);
      expect(audioSearchData.results).toEqual([]);
    });
  });

  describe('Dual Download Workflow', () => {
    it('should download both book and audiobook with correct categories in parallel', async () => {
      // Setup successful search
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search both categories
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      // Select first result from each category
      const selectedBook = bookSearchData.results[0];
      const selectedAudiobook = audioSearchData.results[0];

      // Download both in parallel
      const bookDownloadReq = {
        json: async () => ({
          title: selectedBook.title,
          downloadUrl: selectedBook.downloadUrl,
          category: 'books'
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: selectedAudiobook.title,
          downloadUrl: selectedAudiobook.downloadUrl,
          category: 'audiobooks'
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Verify both downloads succeeded
      expect(bookDownloadRes.status).toBe(200);
      expect(bookDownloadData.ok).toBe(true);
      expect(audioDownloadRes.status).toBe(200);
      expect(audioDownloadData.ok).toBe(true);

      // Verify qBittorrent calls with correct categories
      expect(qbittorrent.qbLogin).toHaveBeenCalledTimes(2);
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledTimes(2);

      // Verify book was added with 'books' category
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        'https://www.myanonamouse.net/tor/download.php/book-download-link-1',
        'books'
      );

      // Verify audiobook was added with 'audiobooks' category
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        'https://www.myanonamouse.net/tor/download.php/audiobook-download-link-1',
        'audiobooks'
      );
    });

    it('should handle partial download success (book succeeds, audiobook fails)', async () => {
      // Setup successful search
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      const selectedBook = bookSearchData.results[0];
      const selectedAudiobook = audioSearchData.results[0];

      // Setup: book download succeeds, audiobook fails
      qbittorrent.qbAddUrl
        .mockResolvedValueOnce(true) // Book succeeds
        .mockRejectedValueOnce(new Error('Failed to add torrent')); // Audiobook fails

      const bookDownloadReq = {
        json: async () => ({
          title: selectedBook.title,
          downloadUrl: selectedBook.downloadUrl,
          category: 'books'
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: selectedAudiobook.title,
          downloadUrl: selectedAudiobook.downloadUrl,
          category: 'audiobooks'
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Verify book succeeded
      expect(bookDownloadRes.status).toBe(200);
      expect(bookDownloadData.ok).toBe(true);

      // Verify audiobook failed
      expect(audioDownloadRes.status).toBe(500);
      expect(audioDownloadData.ok).toBe(false);
      expect(audioDownloadData.error).toContain('Failed to add torrent');
    });

    it('should handle partial download success (audiobook succeeds, book fails)', async () => {
      // Setup successful search
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      const selectedBook = bookSearchData.results[0];
      const selectedAudiobook = audioSearchData.results[0];

      // Setup: audiobook succeeds, book fails due to qBittorrent login
      qbittorrent.qbLogin
        .mockRejectedValueOnce(new Error('qBittorrent login failed: 401 Unauthorized')) // Book fails
        .mockResolvedValueOnce('test-session-cookie'); // Audiobook succeeds

      const bookDownloadReq = {
        json: async () => ({
          title: selectedBook.title,
          downloadUrl: selectedBook.downloadUrl,
          category: 'books'
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: selectedAudiobook.title,
          downloadUrl: selectedAudiobook.downloadUrl,
          category: 'audiobooks'
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Verify book failed
      expect(bookDownloadRes.status).toBe(500);
      expect(bookDownloadData.ok).toBe(false);
      expect(bookDownloadData.error).toContain('qBittorrent login failed');

      // Verify audiobook succeeded
      expect(audioDownloadRes.status).toBe(200);
      expect(audioDownloadData.ok).toBe(true);
    });

    it('should handle both downloads failing', async () => {
      // Setup successful search
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      const selectedBook = bookSearchData.results[0];
      const selectedAudiobook = audioSearchData.results[0];

      // Setup: both downloads fail
      qbittorrent.qbLogin.mockRejectedValue(new Error('qBittorrent unavailable'));

      const bookDownloadReq = {
        json: async () => ({
          title: selectedBook.title,
          downloadUrl: selectedBook.downloadUrl,
          category: 'books'
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: selectedAudiobook.title,
          downloadUrl: selectedAudiobook.downloadUrl,
          category: 'audiobooks'
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Verify both failed
      expect(bookDownloadRes.status).toBe(500);
      expect(bookDownloadData.ok).toBe(false);
      expect(audioDownloadRes.status).toBe(500);
      expect(audioDownloadData.ok).toBe(false);
    });

    it('should handle missing downloadUrl in dual download', async () => {
      // Attempt downloads without downloadUrl
      const bookDownloadReq = {
        json: async () => ({
          title: 'Test Book',
          // Missing downloadUrl
          category: 'books'
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: 'Test Audiobook',
          // Missing downloadUrl
          category: 'audiobooks'
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Both should fail with 400 Bad Request
      expect(bookDownloadRes.status).toBe(400);
      expect(bookDownloadData.ok).toBe(false);
      expect(bookDownloadData.error).toContain('No magnet or torrentUrl provided');

      expect(audioDownloadRes.status).toBe(400);
      expect(audioDownloadData.ok).toBe(false);
      expect(audioDownloadData.error).toContain('No magnet or torrentUrl provided');

      // Verify no qBittorrent calls were made
      expect(qbittorrent.qbLogin).not.toHaveBeenCalled();
      expect(qbittorrent.qbAddUrl).not.toHaveBeenCalled();
    });

    it('should correctly use custom categories for dual downloads', async () => {
      // Setup successful search
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      const selectedBook = bookSearchData.results[0];
      const selectedAudiobook = audioSearchData.results[0];

      // Download with custom categories
      const bookDownloadReq = {
        json: async () => ({
          title: selectedBook.title,
          downloadUrl: selectedBook.downloadUrl,
          category: 'fiction-books' // Custom category
        })
      };

      const audioDownloadReq = {
        json: async () => ({
          title: selectedAudiobook.title,
          downloadUrl: selectedAudiobook.downloadUrl,
          category: 'fiction-audiobooks' // Custom category
        })
      };

      const [bookDownloadRes, audioDownloadRes] = await Promise.all([
        addPOST(bookDownloadReq),
        addPOST(audioDownloadReq)
      ]);

      const [bookDownloadData, audioDownloadData] = await Promise.all([
        bookDownloadRes.json(),
        audioDownloadRes.json()
      ]);

      // Verify both succeeded
      expect(bookDownloadRes.status).toBe(200);
      expect(bookDownloadData.ok).toBe(true);
      expect(audioDownloadRes.status).toBe(200);
      expect(audioDownloadData.ok).toBe(true);

      // Verify custom categories were used
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        expect.any(String),
        'fiction-books'
      );

      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        expect.any(String),
        'fiction-audiobooks'
      );
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle MAM rate limiting during one search', async () => {
      // Setup: books succeed, audiobooks get rate limited
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded'
        });

      // Search books (should succeed)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toHaveLength(2);

      // Search audiobooks (should fail with rate limit)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(502);
      expect(audioSearchData.error).toContain('Search failed: 429');
    });

    it('should handle malformed JSON in one category during search', async () => {
      // Setup: books return malformed JSON, audiobooks succeed
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Invalid JSON'); },
          text: async () => 'Invalid response'
        })
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search books (should fail with JSON error)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(502);
      expect(bookSearchData.error).toContain('Invalid JSON from endpoint');

      // Search audiobooks (should succeed)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(200);
      expect(audioSearchData.results).toHaveLength(2);
    });

    it('should handle HTML response (Cloudflare) in one category', async () => {
      // Setup: audiobooks return HTML (token expired), books succeed
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Invalid JSON'); },
          text: async () => "<!DOCTYPE html><html><head><title>Error</title></head><body>Bad gateway</body></html>"
        });

      // Search books (should succeed)
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toHaveLength(2);

      // Search audiobooks (should detect HTML and return token expired)
      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      expect(audioSearchRes.status).toBe(401);
      expect(audioSearchData.tokenExpired).toBe(true);
      expect(audioSearchData.error).toContain('MAM token has expired');
    });

    it('should handle concurrent dual-fetch requests properly', async () => {
      // Setup mocks for 4 searches (2 dual-fetch workflows)
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse)
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      // First dual-fetch workflow
      const workflow1Books = searchGET({ url: 'http://localhost/api/search?q=test1&category=books' });
      const workflow1Audio = searchGET({ url: 'http://localhost/api/search?q=test1&category=audiobooks' });

      // Second dual-fetch workflow
      const workflow2Books = searchGET({ url: 'http://localhost/api/search?q=test2&category=books' });
      const workflow2Audio = searchGET({ url: 'http://localhost/api/search?q=test2&category=audiobooks' });

      // Execute all concurrently
      const [w1Books, w1Audio, w2Books, w2Audio] = await Promise.all([
        workflow1Books,
        workflow1Audio,
        workflow2Books,
        workflow2Audio
      ]);

      // Verify all succeeded
      expect(w1Books.status).toBe(200);
      expect(w1Audio.status).toBe(200);
      expect(w2Books.status).toBe(200);
      expect(w2Audio.status).toBe(200);

      // Verify 4 API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle empty query in dual-fetch mode', async () => {
      // Search both categories with empty query
      const bookSearchReq = { url: 'http://localhost/api/search?q=&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      // Both should return empty results without calling MAM API
      expect(bookSearchRes.status).toBe(200);
      expect(bookSearchData.results).toEqual([]);
      expect(audioSearchRes.status).toBe(200);
      expect(audioSearchData.results).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity for Dual-Fetch', () => {
    it('should properly construct URLs for both book and audiobook results', async () => {
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search both categories
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      // Verify book URLs
      const bookResult = bookSearchData.results[0];
      expect(bookResult.downloadUrl).toBe('https://www.myanonamouse.net/tor/download.php/book-download-link-1');
      expect(bookResult.torrentUrl).toBe('https://www.myanonamouse.net/t/book-1');
      expect(bookResult.downloadUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/tor\/download\.php\//);
      expect(bookResult.torrentUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/t\//);

      // Verify audiobook URLs
      const audioResult = audioSearchData.results[0];
      expect(audioResult.downloadUrl).toBe('https://www.myanonamouse.net/tor/download.php/audiobook-download-link-1');
      expect(audioResult.torrentUrl).toBe('https://www.myanonamouse.net/t/audio-1');
      expect(audioResult.downloadUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/tor\/download\.php\//);
      expect(audioResult.torrentUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/t\//);
    });

    it('should handle VIP and snatched flags correctly in dual results', async () => {
      global.fetch
        .mockResolvedValueOnce(mockBookResponse)
        .mockResolvedValueOnce(mockAudiobookResponse);

      // Search both categories
      const bookSearchReq = { url: 'http://localhost/api/search?q=test&category=books' };
      const bookSearchRes = await searchGET(bookSearchReq);
      const bookSearchData = await bookSearchRes.json();

      const audioSearchReq = { url: 'http://localhost/api/search?q=test&category=audiobooks' };
      const audioSearchRes = await searchGET(audioSearchReq);
      const audioSearchData = await audioSearchRes.json();

      // Check book VIP flags
      expect(bookSearchData.results[0].vip).toBe(false); // vip: 0
      expect(bookSearchData.results[1].vip).toBe(true);  // vip: 1

      // Check snatched flags
      expect(bookSearchData.results[0].snatched).toBe(false); // my_snatched: 0
      expect(audioSearchData.results[0].snatched).toBe(false); // my_snatched: 0
    });
  });
});

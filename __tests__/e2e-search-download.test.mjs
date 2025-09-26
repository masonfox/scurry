import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GET as searchGET } from '../app/api/search/route.js';
import { POST as addPOST } from '../app/api/add/route.js';
import { buildMamDownloadUrl, buildMamTorrentUrl } from '../src/lib/utilities.js';

// Mock all external dependencies
jest.mock('../src/lib/config', () => ({
  readMamToken: jest.fn(() => 'test-mam-token-12345'),
  config: { 
    qbUrl: 'http://localhost:8080', 
    qbUser: 'testuser', 
    qbPass: 'testpass', 
    qbCategory: 'books',
    mamTokenFile: 'secrets/mam_api_token'
  }
}));

jest.mock('../src/lib/qbittorrent', () => ({
  qbLogin: jest.fn(),
  qbAddUrl: jest.fn()
}));

// Mock fetch globally for MAM API calls
global.fetch = jest.fn();

describe('E2E Search and Download Integration Tests', () => {
  let mockMamResponse;
  let mockQbLogin;
  let mockQbAddUrl;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get references to mocked functions
    const { qbLogin, qbAddUrl } = require('../src/lib/qbittorrent');
    mockQbLogin = qbLogin;
    mockQbAddUrl = qbAddUrl;

    // Default MAM API response
    mockMamResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: '12345',
            dl: 'test-download-link-abc123',
            title: 'Test Book Title',
            size: '2.5 MB',
            filetype: 'epub',
            added: '2025-09-25',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Test Author"}',
            seeders: 15,
            leechers: 3,
            times_completed: 25
          },
          {
            id: '67890',
            dl: 'test-download-link-def456',
            title: 'Another Test Book',
            size: '1.8 MB',
            filetype: 'pdf',
            added: '2025-09-24',
            vip: 1,
            my_snatched: 1,
            author_info: '{"author":"Another Author"}',
            seeders: 8,
            leechers: 1,
            times_completed: 12
          }
        ]
      }),
      text: async () => ""
    };

    // Default qBittorrent mocks
    mockQbLogin.mockResolvedValue('test-session-cookie');
    mockQbAddUrl.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Complete Search to Download Workflow', () => {
    it('should successfully search for torrents and download the first result', async () => {
      // Setup MAM API response
      global.fetch.mockResolvedValueOnce(mockMamResponse);

      // Step 1: Perform search
      const searchReq = { url: 'http://localhost/api/search?q=test book&category=books' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      // Verify search results
      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(2);
      expect(searchData.results[0]).toMatchObject({
        id: '12345',
        title: 'Test Book Title',
        size: '2.5 MB',
        filetypes: 'epub',
        author: 'Test Author',
        seeders: '15',
        leechers: '3',
        downloads: '25',
        vip: false,
        snatched: false
      });

      // Verify URLs are properly constructed
      expect(searchData.results[0].downloadUrl).toBe('https://www.myanonamouse.net/tor/download.php/test-download-link-abc123');
      expect(searchData.results[0].torrentUrl).toBe('https://www.myanonamouse.net/t/12345');

      // Step 2: Download the first result
      const firstResult = searchData.results[0];
      const downloadReq = {
        json: async () => ({
          title: firstResult.title,
          downloadUrl: firstResult.downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      // Verify download success
      expect(downloadRes.status).toBe(200);
      expect(downloadData.ok).toBe(true);

      // Verify qBittorrent interactions
      expect(mockQbLogin).toHaveBeenCalledWith(
        'http://localhost:8080',
        'testuser',
        'testpass'
      );
      expect(mockQbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        'https://www.myanonamouse.net/tor/download.php/test-download-link-abc123',
        'books'
      );
    });

    it('should successfully search audiobooks and download with custom category', async () => {
      // Setup MAM API response for audiobooks
      const audiobookResponse = {
        ...mockMamResponse,
        json: async () => ({
          data: [{
            id: '99999',
            dl: 'audiobook-download-link',
            title: 'Test Audiobook',
            size: '150 MB',
            filetype: 'm4b',
            added: '2025-09-25',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Audio Author"}',
            seeders: 5,
            leechers: 0,
            times_completed: 8
          }]
        })
      };
      global.fetch.mockResolvedValueOnce(audiobookResponse);

      // Step 1: Search audiobooks
      const searchReq = { url: 'http://localhost/api/search?q=audio test&category=audiobooks' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(1);
      expect(searchData.results[0].filetypes).toBe('m4b');

      // Step 2: Download with custom category
      const downloadReq = {
        json: async () => ({
          title: searchData.results[0].title,
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'audiobooks'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(200);
      expect(downloadData.ok).toBe(true);
      expect(mockQbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        'https://www.myanonamouse.net/tor/download.php/audiobook-download-link',
        'audiobooks'
      );
    });

    it('should handle search failure and prevent download attempt', async () => {
      // Setup failed MAM API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error'
      });

      // Step 1: Attempt search
      const searchReq = { url: 'http://localhost/api/search?q=failing query' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      // Verify search failure
      expect(searchRes.status).toBe(502);
      expect(searchData.results).toEqual([]);
      expect(searchData.error).toContain('Search failed: 500');

      // Since search failed, no download should be attempted
      expect(mockQbLogin).not.toHaveBeenCalled();
      expect(mockQbAddUrl).not.toHaveBeenCalled();
    });

    it('should handle MAM token expiration during search', async () => {
      // Setup token expiration response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'You are not signed in'
      });

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(401);
      expect(searchData.tokenExpired).toBe(true);
      expect(searchData.error).toContain('MAM token has expired');
    });

    it('should handle qBittorrent login failure during download', async () => {
      // Setup successful search
      global.fetch.mockResolvedValueOnce(mockMamResponse);
      mockQbLogin.mockRejectedValueOnce(new Error('qBittorrent login failed: 401 Unauthorized'));

      // Step 1: Successful search
      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(2);

      // Step 2: Failed download due to qBittorrent login
      const downloadReq = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(500);
      expect(downloadData.ok).toBe(false);
      expect(downloadData.error).toContain('qBittorrent login failed');
      expect(mockQbAddUrl).not.toHaveBeenCalled();
    });

    it('should handle qBittorrent add failure during download', async () => {
      // Setup successful search
      global.fetch.mockResolvedValueOnce(mockMamResponse);
      mockQbAddUrl.mockRejectedValueOnce(new Error('Failed to add torrent'));

      // Step 1: Successful search
      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);

      // Step 2: Failed download due to qBittorrent add
      const downloadReq = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(500);
      expect(downloadData.ok).toBe(false);
      expect(downloadData.error).toContain('Failed to add torrent');
      
      // Verify login was attempted but add failed
      expect(mockQbLogin).toHaveBeenCalled();
      expect(mockQbAddUrl).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search query', async () => {
      const searchReq = { url: 'http://localhost/api/search?q=' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled(); // No MAM API call for empty query
    });

    it('should handle MAM API returning no results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ error: 'No results found' }),
        text: async () => ""
      });

      const searchReq = { url: 'http://localhost/api/search?q=nonexistent' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toEqual([]);
    });

    it('should handle invalid download URL in add request', async () => {
      const downloadReq = {
        json: async () => ({
          title: 'Test Book',
          // Missing downloadUrl
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(400);
      expect(downloadData.ok).toBe(false);
      expect(downloadData.error).toContain('No magnet or torrentUrl provided');
      expect(mockQbLogin).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON from MAM API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => 'Invalid response'
      });

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(502);
      expect(searchData.error).toContain('Invalid JSON from endpoint');
    });

    it('should use fallback category when not specified in download', async () => {
      // Setup successful search
      global.fetch.mockResolvedValueOnce(mockMamResponse);

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      // Download without specifying category (should use config default)
      const downloadReq = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: searchData.results[0].downloadUrl
          // No category specified
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(200);
      expect(downloadData.ok).toBe(true);
      expect(mockQbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        expect.any(String),
        'books' // Should use config.qbCategory as fallback
      );
    });
  });

  describe('Data Integrity and URL Construction', () => {
    it('should properly construct MAM URLs from search results', async () => {
      global.fetch.mockResolvedValueOnce(mockMamResponse);

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      const firstResult = searchData.results[0];
      
      expect(firstResult.downloadUrl).toBe(buildMamDownloadUrl('test-download-link-abc123'));
      expect(firstResult.torrentUrl).toBe(buildMamTorrentUrl('12345'));
      expect(firstResult.downloadUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/tor\/download\.php\//);
      expect(firstResult.torrentUrl).toMatch(/^https:\/\/www\.myanonamouse\.net\/t\//);
    });

    it('should handle missing or null fields in MAM response gracefully', async () => {
      const incompleteResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{
            id: '12345',
            dl: 'download-link',
            title: null, // Missing title
            size: undefined, // Missing size
            filetype: '',
            // author_info missing entirely
            seeders: null,
            leechers: 0
            // times_completed missing
          }]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(incompleteResponse);

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(1);
      
      const result = searchData.results[0];
      expect(result.title).toBe('');
      expect(result.size).toBe('');
      expect(result.author).toBeNull();
      expect(result.seeders).toBe('0');
      expect(result.downloads).toBe('0');
    });
  });

  describe('Authentication and Session Management', () => {
    it('should handle qBittorrent session cookie properly', async () => {
      // Setup successful search
      global.fetch.mockResolvedValueOnce(mockMamResponse);
      
      // Mock qBittorrent login with specific cookie
      const testCookie = 'SID=test-session-12345; Path=/; HttpOnly';
      mockQbLogin.mockResolvedValueOnce(testCookie);

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      const downloadReq = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      await addPOST(downloadReq);

      expect(mockQbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        testCookie,
        expect.any(String),
        'books'
      );
    });

    it('should handle concurrent download requests properly', async () => {
      // Setup successful search
      global.fetch.mockResolvedValueOnce(mockMamResponse);

      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      // Simulate concurrent downloads
      const downloadReq1 = {
        json: async () => ({
          title: 'First Book',
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadReq2 = {
        json: async () => ({
          title: 'Second Book',
          downloadUrl: searchData.results[1].downloadUrl,
          category: 'books'
        })
      };

      const [download1, download2] = await Promise.all([
        addPOST(downloadReq1),
        addPOST(downloadReq2)
      ]);

      const [data1, data2] = await Promise.all([
        download1.json(),
        download2.json()
      ]);

      expect(data1.ok).toBe(true);
      expect(data2.ok).toBe(true);
      expect(mockQbLogin).toHaveBeenCalledTimes(2); // Each request gets its own session
      expect(mockQbAddUrl).toHaveBeenCalledTimes(2);
    });
  });
});
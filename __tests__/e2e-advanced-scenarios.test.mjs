import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GET as searchGET } from '../app/api/search/route.js';
import { POST as addPOST } from '../app/api/add/route.js';

// Mock dependencies
jest.mock('../src/lib/config', () => ({
  readMamToken: jest.fn(() => 'test-token'),
  config: { 
    qbUrl: 'http://localhost:8080', 
    qbUser: 'testuser', 
    qbPass: 'testpass', 
    qbCategory: 'books'
  }
}));

jest.mock('../src/lib/qbittorrent', () => ({
  qbLogin: jest.fn(),
  qbAddUrl: jest.fn()
}));

global.fetch = jest.fn();

describe('E2E Integration Tests - Advanced Scenarios', () => {
  let mockQbLogin;
  let mockQbAddUrl;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get references to mocked functions
    const { qbLogin, qbAddUrl } = require('../src/lib/qbittorrent');
    mockQbLogin = qbLogin;
    mockQbAddUrl = qbAddUrl;

    // Default qBittorrent mocks
    mockQbLogin.mockResolvedValue('test-session-cookie');
    mockQbAddUrl.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Real-world Search Scenarios', () => {
    it('should handle searching for popular books with high seed counts', async () => {
      const popularTorrentResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '11111',
              dl: 'popular-book-1-link',
              title: 'Popular Fantasy Book 1',
              size: '3.2 MB',
              filetype: 'epub',
              added: '2025-09-25',
              vip: 1,
              my_snatched: 0,
              author_info: '{"author":"Popular Author"}',
              seeders: 150,
              leechers: 25,
              times_completed: 600
            },
            {
              id: '22222',
              dl: 'popular-book-2-link',
              title: 'Popular Fantasy Book 2',
              size: '2.8 MB',
              filetype: 'epub',
              added: '2025-09-24',
              vip: 0,
              my_snatched: 0,
              author_info: '{"author":"Popular Author"}',
              seeders: 120,
              leechers: 20,
              times_completed: 450
            }
          ]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(popularTorrentResponse);

      // Step 1: Search
      const searchReq = { url: 'http://localhost/api/search?q=popular fantasy series&category=books' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(2);
      expect(searchData.results[0].seeders).toBe('150');
      expect(searchData.results[0].vip).toBe(true);

      // Step 2: Download the first (most popular) result
      const downloadReq = {
        json: async () => ({
          title: searchData.results[0].title,
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(200);
      expect(downloadData.ok).toBe(true);
      expect(mockQbLogin).toHaveBeenCalled();
      expect(mockQbAddUrl).toHaveBeenCalled();
    });

    it('should handle searching for rare books with low availability', async () => {
      const rareTorrentResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '33333',
              dl: 'rare-book-link',
              title: 'Rare Obscure Book',
              size: '0.8 MB',
              filetype: 'epub',
              added: '2025-09-20',
              vip: 0,
              my_snatched: 0,
              author_info: '{"author":"Obscure Author"}',
              seeders: 1,
              leechers: 0,
              times_completed: 2
            }
          ]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(rareTorrentResponse);

      const searchReq = { url: 'http://localhost/api/search?q=rare obscure title&category=books' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(1);
      expect(searchData.results[0].seeders).toBe('1');
      expect(searchData.results[0].leechers).toBe('0');

      // Should still be able to download even with low availability
      const downloadReq = {
        json: async () => ({
          title: searchData.results[0].title,
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(200);
      expect(downloadData.ok).toBe(true);
    });

    it('should handle audiobook searches with different file formats', async () => {
      const audiobookResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'audio1',
              dl: 'audiobook-m4b-link',
              title: 'Fantasy Audiobook in M4B',
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
              id: 'audio2',
              dl: 'audiobook-mp3-link', 
              title: 'Fantasy Audiobook in MP3',
              size: '380 MB',
              filetype: 'mp3',
              added: '2025-09-22',
              vip: 0,
              my_snatched: 0,
              author_info: '{"author":"Audio Author 2"}',
              seeders: 8,
              leechers: 1,
              times_completed: 12
            }
          ]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(audiobookResponse);

      const searchReq = { url: 'http://localhost/api/search?q=fantasy audiobook&category=audiobooks' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(2);
      expect(searchData.results[0].filetypes).toBe('m4b');
      expect(searchData.results[1].filetypes).toBe('mp3');
      expect(searchData.results[0].size).toBe('450 MB');

      // Download audiobook with proper category
      const downloadReq = {
        json: async () => ({
          title: searchData.results[0].title,
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'audiobooks'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      expect(downloadRes.status).toBe(200);
      expect(mockQbAddUrl).toHaveBeenCalledWith(
        'http://localhost:8080',
        'test-session-cookie',
        expect.any(String),
        'audiobooks'
      );
    });
  });

  describe('Complex Error Recovery Scenarios', () => {
    it('should handle network interruption during search', async () => {
      // Simulate network timeout
      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));
      
      const searchReq = { url: 'http://localhost/api/search?q=network test' };
      
      // This should throw an error since the route doesn't catch network errors
      await expect(searchGET(searchReq)).rejects.toThrow('Network timeout');
    });

    it('should handle qBittorrent being temporarily unavailable', async () => {
      const torrentResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{
            id: '12345',
            dl: 'test-link',
            title: 'Test Book',
            size: '2.0 MB',
            filetype: 'epub',
            added: '2025-09-25',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Test Author"}',
            seeders: 10,
            leechers: 2,
            times_completed: 15
          }]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(torrentResponse);
      
      // Setup qBittorrent to be unavailable
      mockQbLogin.mockRejectedValueOnce(new Error('Connection refused - qBittorrent not available'));

      // Search should succeed
      const searchReq = { url: 'http://localhost/api/search?q=test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(1);
      
      // Download should fail
      const downloadReq = {
        json: async () => ({
          title: searchData.results[0].title,
          downloadUrl: searchData.results[0].downloadUrl,
          category: 'books'
        })
      };

      const downloadRes = await addPOST(downloadReq);
      const downloadData = await downloadRes.json();

      expect(downloadRes.status).toBe(500);
      expect(downloadData.ok).toBe(false);
      expect(downloadData.error).toContain('Connection refused');
    });

    it('should handle MAM rate limiting', async () => {
      // Simulate rate limiting response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const searchReq = { url: 'http://localhost/api/search?q=rate limited query' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(502);
      expect(searchData.error).toContain('Search failed: 429');
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should handle malformed author information gracefully', async () => {
      const torrentsWithBadAuthors = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '1',
              dl: 'bad-author-1',
              title: 'Book with Bad Author JSON',
              size: '1.5 MB',
              filetype: 'epub',
              added: '2025-09-25',
              vip: 0,
              my_snatched: 0,
              author_info: 'not-json-at-all', // Invalid JSON
              seeders: 10,
              leechers: 2,
              times_completed: 15
            },
            {
              id: '2',
              dl: 'bad-author-2',
              title: 'Book with Empty Author',
              size: '1.2 MB',
              filetype: 'epub',
              added: '2025-09-24',
              vip: 0,
              my_snatched: 0,
              author_info: '{}', // Empty JSON
              seeders: 5,
              leechers: 1,
              times_completed: 8
            },
            {
              id: '3',
              dl: 'bad-author-3',
              title: 'Book with Null Author',
              size: '1.8 MB',
              filetype: 'epub',
              added: '2025-09-23',
              vip: 0,
              my_snatched: 0,
              author_info: null, // Null
              seeders: 3,
              leechers: 0,
              times_completed: 5
            }
          ]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(torrentsWithBadAuthors);

      const searchReq = { url: 'http://localhost/api/search?q=author test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(3);
      
      // All should have null authors due to malformed author_info
      searchData.results.forEach(result => {
        expect(result.author).toBeNull();
      });
    });
  });

  describe('Performance and Load Testing Scenarios', () => {
    it('should handle rapid sequential searches', async () => {
      const queries = ['query1', 'query2', 'query3'];
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{
            id: '12345',
            dl: 'test-link',
            title: 'Test Book',
            size: '2.0 MB',
            filetype: 'epub',
            added: '2025-09-25',
            vip: 0,
            my_snatched: 0,
            author_info: '{"author":"Test Author"}',
            seeders: 10,
            leechers: 2,
            times_completed: 15
          }]
        }),
        text: async () => ""
      };
      
      // Setup mocks for each query
      queries.forEach(() => {
        global.fetch.mockResolvedValueOnce(mockResponse);
      });

      // Execute searches rapidly
      const searchPromises = queries.map(query => 
        searchGET({ url: `http://localhost/api/search?q=${query}` })
      );

      const searchResponses = await Promise.all(searchPromises);
      const searchDataArray = await Promise.all(
        searchResponses.map(res => res.json())
      );

      // All searches should succeed
      searchResponses.forEach(res => expect(res.status).toBe(200));
      searchDataArray.forEach(data => expect(data.results).toHaveLength(1));
      
      // Verify each search made a separate API call
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Category-specific Workflows', () => {
    it('should handle custom categories in download requests', async () => {
      const customCategories = ['fiction', 'non-fiction', 'textbooks'];
      
      for (const category of customCategories) {
        const downloadReq = {
          json: async () => ({
            title: `Book for ${category}`,
            downloadUrl: 'https://www.myanonamouse.net/tor/download.php/test-link',
            category
          })
        };

        const downloadRes = await addPOST(downloadReq);
        const downloadData = await downloadRes.json();

        expect(downloadRes.status).toBe(200);
        expect(downloadData.ok).toBe(true);
        
        // Verify category was passed correctly
        const lastCall = mockQbAddUrl.mock.calls[mockQbAddUrl.mock.calls.length - 1];
        expect(lastCall[3]).toBe(category); // Category is 4th parameter
        
        jest.clearAllMocks();
      }
    });
  });

  describe('Edge Cases in URL Construction', () => {
    it('should handle missing or invalid download links', async () => {
      const torrentsWithBadLinks = {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '1',
              dl: '', // Empty download link
              title: 'Book with Empty Download Link',
              size: '1.5 MB',
              filetype: 'epub',
              added: '2025-09-25',
              vip: 0,
              my_snatched: 0,
              author_info: '{"author":"Test Author"}',
              seeders: 10,
              leechers: 2,
              times_completed: 15
            },
            {
              id: '2',
              dl: null, // Null download link
              title: 'Book with Null Download Link',
              size: '1.2 MB',
              filetype: 'epub',
              added: '2025-09-24',
              vip: 0,
              my_snatched: 0,
              author_info: '{"author":"Test Author"}',
              seeders: 5,
              leechers: 1,
              times_completed: 8
            }
          ]
        }),
        text: async () => ""
      };

      global.fetch.mockResolvedValueOnce(torrentsWithBadLinks);

      const searchReq = { url: 'http://localhost/api/search?q=bad links test' };
      const searchRes = await searchGET(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.results).toHaveLength(2);
      
      // All should have null download URLs due to empty/null dl fields
      searchData.results.forEach(result => {
        expect(result.downloadUrl).toBeNull();
      });
    });
  });
});
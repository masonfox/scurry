import { jest } from '@jest/globals';
import { searchMamForBook, findBestMatch, autoDownloadBook } from '../src/lib/bookSearch.js';

// Mock dependencies
jest.mock('../src/lib/config.js', () => ({
  config: {
    qbUrl: 'http://localhost:8080',
    qbCategory: 'books',
    qbUser: 'admin',
    qbPass: 'adminadmin'
  }
}));

jest.mock('../src/lib/database.js', () => ({
  getMamToken: jest.fn().mockResolvedValue('mock-token'),
  trackDownload: jest.fn().mockResolvedValue({ _id: 'download_123' }),
  updateBookStatus: jest.fn().mockResolvedValue({ _id: 'book_123', downloadAttempts: 0 }),
  isBookDownloaded: jest.fn().mockResolvedValue(false),
  getBookDownloadAttempts: jest.fn().mockResolvedValue(0),
  getDatabase: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ downloadAttempts: 0 })
  })
}));

jest.mock('../src/lib/constants.js', () => ({
  MAM_BASE: 'https://www.myanonamouse.net'
}));

jest.mock('../src/lib/utilities.js', () => ({
  buildPayload: jest.fn().mockReturnValue({ searchStr: 'test' }),
  buildMamDownloadUrl: jest.fn().mockReturnValue('http://download.url'),
  parseAuthorInfo: jest.fn().mockReturnValue('Test Author')
}));

// Mock fetch
global.fetch = jest.fn();

describe('Book search utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMamForBook', () => {
    test('should search MAM for book', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [
            {
              id: 123,
              title: 'Test Book',
              size: '10MB',
              filetype: 'EPUB',
              vip: 0,
              my_snatched: 0,
              author_info: 'Test Author',
              seeders: 5,
              leechers: 1,
              times_completed: 10,
              dl: 'download-url'
            }
          ]
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const results = await searchMamForBook('Test Book');
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('title', 'Test Book');
      expect(results[0]).toHaveProperty('similarity');
    });

    test('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(searchMamForBook('Test Book')).rejects.toThrow('MAM search failed: 500');
    });

    test('should handle empty results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ error: 'No results' })
      });

      const results = await searchMamForBook('Nonexistent Book');
      expect(results).toEqual([]);
    });
  });

  describe('findBestMatch', () => {
    test('should find best match with high similarity', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [
            {
              id: 123,
              title: 'Test Book',
              size: '10MB',
              filetype: 'EPUB',
              vip: 0,
              my_snatched: 0,
              author_info: 'Test Author',
              seeders: 5,
              leechers: 1,
              times_completed: 10,
              dl: 'download-url'
            }
          ]
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const match = await findBestMatch('Test Book');
      expect(match).toBeTruthy();
      expect(match.title).toBe('Test Book');
    });

    test('should return null for low similarity', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [
            {
              id: 123,
              title: 'Completely Different Book',
              size: '10MB',
              filetype: 'EPUB',
              vip: 0,
              my_snatched: 0,
              author_info: 'Different Author',
              seeders: 5,
              leechers: 1,
              times_completed: 10,
              dl: 'download-url'
            }
          ]
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const match = await findBestMatch('Test Book');
      expect(match).toBeNull();
    });
  });

  describe('autoDownloadBook', () => {
    test('should successfully auto-download book', async () => {
      // Mock MAM search
      global.fetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 123,
              title: 'Test Book',
              size: '10MB',
              filetype: 'EPUB',
              vip: 0,
              my_snatched: 0,
              author_info: 'Test Author',
              seeders: 5,
              leechers: 1,
              times_completed: 10,
              dl: 'download-url'
            }
          ]
        })
      }));

      // Mock qbLogin and qbAddUrl by mocking the qbittorrent module
      const mockQbittorrent = {
        qbLogin: jest.fn().mockResolvedValue('mock-cookie'),
        qbAddUrl: jest.fn().mockResolvedValue(true)
      };
      
      jest.doMock('../src/lib/qbittorrent.js', () => mockQbittorrent);

      const result = await autoDownloadBook(123, 'Test Book');
      expect(result.success).toBe(true);
      expect(result.torrent).toBeTruthy();
    });

    test('should handle no match found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const result = await autoDownloadBook(123, 'Nonexistent Book');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('No suitable match found');
    });
  });
});

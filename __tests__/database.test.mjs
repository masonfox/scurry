import { jest } from '@jest/globals';
import { getConfig, setConfig, saveBook, getAllBooks, updateBookStatus, trackDownload, isBookDownloaded } from '../src/lib/database.js';

// Mock nano
jest.mock('nano', () => {
  const mockDoc = { _id: 'test', value: 'test-value' };
  const mockDb = {
    get: jest.fn().mockResolvedValue(mockDoc),
    insert: jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, ok: true })),
    list: jest.fn().mockResolvedValue({ rows: [{ doc: mockDoc }] }),
    find: jest.fn().mockResolvedValue({ docs: [mockDoc] }),
  };
  
  const mockCouch = {
    db: {
      get: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      use: jest.fn().mockReturnValue(mockDb),
    }
  };

  return jest.fn().mockReturnValue(mockCouch);
});

// Mock config
jest.mock('../src/lib/config.js', () => ({
  config: {
    couchdbUrl: 'http://localhost:5984',
    couchdbUser: 'admin',
    couchdbPassword: 'password',
  }
}));

describe('Database utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration management', () => {
    test('should get configuration value', async () => {
      const value = await getConfig('test-key');
      expect(value).toBe('test-value');
    });

    test('should set configuration value', async () => {
      const result = await setConfig('test-key', 'new-value');
      expect(result).toHaveProperty('value', 'new-value');
      expect(result).toHaveProperty('_id');
    });

    test('should handle missing configuration', async () => {
      const nano = (await import('nano')).default;
      const mockCouch = nano();
      const mockDb = mockCouch.db.use();
      
      mockDb.get.mockRejectedValueOnce({ statusCode: 404 });
      
      const value = await getConfig('missing-key');
      expect(value).toBeNull();
    });
  });

  describe('Book management', () => {
    test('should save a book', async () => {
      const book = { hardcoverId: 123, title: 'Test Book' };
      const result = await saveBook(book);
      
      // The function should work and return something
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should get all books', async () => {
      const books = await getAllBooks();
      expect(Array.isArray(books)).toBe(true);
      expect(books).toHaveLength(1);
    });

    test('should update book status', async () => {
      const result = await updateBookStatus(123, 'downloaded', { mamTorrentId: 456 });
      expect(result).toHaveProperty('status', 'downloaded');
      expect(result).toHaveProperty('mamTorrentId', 456);
    });
  });

  describe('Download tracking', () => {
    test('should track download', async () => {
      const result = await trackDownload(123, 456, 'auto');
      expect(result).toHaveProperty('hardcoverId', 123);
      expect(result).toHaveProperty('mamTorrentId', 456);
      expect(result).toHaveProperty('source', 'auto');
    });

    test('should check if book is downloaded', async () => {
      const isDownloaded = await isBookDownloaded(123);
      expect(typeof isDownloaded).toBe('boolean');
    });
  });
});

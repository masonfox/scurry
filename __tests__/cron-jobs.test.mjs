import { jest } from '@jest/globals';
import { triggerManualBookSync } from '../src/lib/cronJobs.js';

// Mock dependencies
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
    stop: jest.fn()
  })
}));

jest.mock('../src/lib/hardcover.js', () => ({
  getAllWantToReadBooks: jest.fn().mockResolvedValue([
    { hardcoverId: 1, title: 'Book 1' },
    { hardcoverId: 2, title: 'Book 2' }
  ])
}));

jest.mock('../src/lib/database.js', () => ({
  saveBook: jest.fn().mockResolvedValue({ _id: 'book_1' }),
  getAllBooks: jest.fn().mockResolvedValue([
    { 
      hardcoverId: 1, 
      title: 'Book 1', 
      status: 'wanted', 
      downloadAttempts: 0,
      lastSearched: null 
    }
  ]),
  isBookDownloaded: jest.fn().mockResolvedValue(false)
}));

jest.mock('../src/lib/bookSearch.js', () => ({
  autoDownloadBook: jest.fn().mockResolvedValue({
    success: true,
    torrent: { id: 123, title: 'Book 1' },
    similarity: 0.95
  })
}));

describe('Cron job utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process manual book sync', async () => {
    await triggerManualBookSync();
    
    const { getAllWantToReadBooks } = await import('../src/lib/hardcover.js');
    const { saveBook, getAllBooks } = await import('../src/lib/database.js');
    const { autoDownloadBook } = await import('../src/lib/bookSearch.js');
    
    expect(getAllWantToReadBooks).toHaveBeenCalled();
    expect(saveBook).toHaveBeenCalledWith({ hardcoverId: 1, title: 'Book 1' });
    expect(saveBook).toHaveBeenCalledWith({ hardcoverId: 2, title: 'Book 2' });
    expect(getAllBooks).toHaveBeenCalled();
    expect(autoDownloadBook).toHaveBeenCalledWith(1, 'Book 1', undefined);
  }, 15000);

  test('should handle errors gracefully', async () => {
    const { getAllWantToReadBooks } = await import('../src/lib/hardcover.js');
    getAllWantToReadBooks.mockRejectedValueOnce(new Error('API Error'));

    await expect(triggerManualBookSync()).rejects.toThrow('API Error');
  });

  test('should skip already downloaded books', async () => {
    const { isBookDownloaded } = await import('../src/lib/database.js');
    const { autoDownloadBook } = await import('../src/lib/bookSearch.js');
    
    isBookDownloaded.mockResolvedValueOnce(true);

    await triggerManualBookSync();
    
    expect(autoDownloadBook).not.toHaveBeenCalled();
  });

  test('should skip books with too many attempts', async () => {
    const { getAllBooks } = await import('../src/lib/database.js');
    const { autoDownloadBook } = await import('../src/lib/bookSearch.js');
    
    getAllBooks.mockResolvedValueOnce([
      { 
        hardcoverId: 1, 
        title: 'Book 1', 
        status: 'failed', 
        downloadAttempts: 5,
        lastSearched: null 
      }
    ]);

    await triggerManualBookSync();
    
    expect(autoDownloadBook).not.toHaveBeenCalled();
  });
});

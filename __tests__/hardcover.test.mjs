import { jest } from '@jest/globals';
import { getHardcoverUserId, getWantToReadBooks, getAllWantToReadBooks } from '../src/lib/hardcover.js';

// Mock graphql-request
jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: jest.fn().mockImplementation((query, variables) => {
      if (query.includes('UserID')) {
        return Promise.resolve({ me: { id: 12345 } });
      }
      if (query.includes('WantToReadTitles')) {
        return Promise.resolve({
          user_books: [
            { book: { id: 1, title: 'Book 1' } },
            { book: { id: 2, title: 'Book 2' } }
          ]
        });
      }
      return Promise.resolve({});
    })
  }))
}));

// Mock database
jest.mock('../src/lib/database.js', () => ({
  getConfig: jest.fn().mockImplementation((key) => {
    if (key === 'hardcover_token') return 'mock-token';
    if (key === 'hardcover_user_id') return '12345';
    return null;
  })
}));

describe('Hardcover API utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get Hardcover user ID', async () => {
    const userId = await getHardcoverUserId();
    expect(userId).toBe(12345);
  });

  test('should get want-to-read books', async () => {
    const books = await getWantToReadBooks(10, 0);
    expect(Array.isArray(books)).toBe(true);
    expect(books).toHaveLength(2);
    expect(books[0]).toHaveProperty('hardcoverId', 1);
    expect(books[0]).toHaveProperty('title', 'Book 1');
  });

  test('should get all want-to-read books', async () => {
    const books = await getAllWantToReadBooks();
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThan(0);
  });

  test('should handle API errors', async () => {
    const { GraphQLClient } = await import('graphql-request');
    GraphQLClient.mockImplementationOnce(() => ({
      request: jest.fn().mockRejectedValue(new Error('API Error'))
    }));

    await expect(getHardcoverUserId()).rejects.toThrow('Failed to fetch user ID from Hardcover');
  });

  test('should handle missing token', async () => {
    const { getConfig } = await import('../src/lib/database.js');
    getConfig.mockImplementationOnce(() => null);

    await expect(getHardcoverUserId()).rejects.toThrow('Hardcover API token not configured');
  });
});

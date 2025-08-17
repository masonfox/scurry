// Hardcover API utilities
import "server-only";
import { GraphQLClient } from 'graphql-request';
import { getConfig } from './database.js';

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

export async function getHardcoverClient() {
  const token = await getConfig('hardcover_token');
  if (!token) {
    throw new Error('Hardcover API token not configured. See Config page.');
  }

  return new GraphQLClient(HARDCOVER_API_URL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}

export async function getHardcoverUserId() {
  const client = await getHardcoverClient();
  
  const query = `
    query UserID {
      me {
        id
      }
    }
  `;

  try {
    const data = await client.request(query);
    // Handle both array and object responses
    const userId = Array.isArray(data.me) ? data.me[0]?.id : data.me?.id;
    return userId;
  } catch (error) {
    console.error('Error fetching Hardcover user ID:', error);
    throw new Error('Failed to fetch user ID from Hardcover');
  }
}

export async function getWantToReadBooks(limit = 50, offset = 0) {
  const client = await getHardcoverClient();
  const userId = await getConfig('hardcover_user_id');
  
  if (!userId) {
    throw new Error('Hardcover user ID not configured');
  }

  const query = `
    query WantToReadTitles($userId: Int!, $limit: Int!, $offset: Int!) {
      user_books(
        where: {user_id: {_eq: $userId}, status_id: {_eq: 1}}
        distinct_on: book_id
        limit: $limit
        offset: $offset
      ) {
        book {
          id
          title
          contributions {
            author {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(query, { userId: parseInt(userId), limit, offset });
    return data.user_books?.map(userBook => {
      // Extract author names from contributions
      const authors = userBook.book.contributions
        ?.filter(contrib => contrib.author)
        ?.map(contrib => contrib.author.name)
        ?.join(', ') || '';
        
      return {
        hardcoverId: userBook.book.id,
        title: userBook.book.title,
        author: authors
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching want-to-read books:', error);
    throw new Error('Failed to fetch books from Hardcover');
  }
}

export async function getAllWantToReadBooks() {
  const allBooks = [];
  let offset = 0;
  const limit = 50;
  
  while (true) {
    const books = await getWantToReadBooks(limit, offset);
    if (books.length === 0) break;
    
    allBooks.push(...books);
    offset += limit;
    
    // Prevent infinite loops - Hardcover probably has reasonable limits
    if (offset > 10000) break;
  }
  
  return allBooks;
}

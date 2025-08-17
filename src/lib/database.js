// CouchDB database utilities
import "server-only";
import nano from "nano";
import { config } from "./config.js";

let couchInstance = null;

export function getCouchInstance() {
  if (!couchInstance) {
    couchInstance = nano({
      url: config.couchdbUrl,
      parseUrl: false,
      requestDefaults: {
        auth: {
          username: config.couchdbUser,
          password: config.couchdbPassword,
        }
      }
    });
  }
  return couchInstance;
}

// Initialize databases if they don't exist
export async function initializeDatabases() {
  const couch = getCouchInstance();
  
  const databases = [
    'scurry_config',     // Store app configuration (MAM token, Hardcover token, user ID)
    'scurry_books',      // Store books from Hardcover
    'scurry_downloads'   // Track downloads/snatches
  ];

  for (const dbName of databases) {
    try {
      await couch.db.get(dbName);
    } catch (error) {
      if (error.statusCode === 404) {
        await couch.db.create(dbName);
        console.log(`Created database: ${dbName}`);
      } else {
        throw error;
      }
    }
  }
}

// Get database instance
export function getDatabase(dbName) {
  const couch = getCouchInstance();
  return couch.db.use(dbName);
}

// Configuration helpers
export async function getConfig(key) {
  const db = getDatabase('scurry_config');
  try {
    const doc = await db.get(key);
    return doc.value;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function setConfig(key, value) {
  const db = getDatabase('scurry_config');
  let doc;
  
  try {
    doc = await db.get(key);
    doc.value = value;
    doc.updatedAt = new Date().toISOString();
  } catch (error) {
    if (error.statusCode === 404) {
      doc = {
        _id: key,
        value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      throw error;
    }
  }
  
  await db.insert(doc);
  return doc;
}

// Get MAM token from database only
export async function getMamToken() {
  try {
    await initializeDatabases();
    const token = await getConfig('mam_token');
    return token;
  } catch (error) {
    console.error('Failed to get MAM token from database:', error.message);
    throw new Error('MAM token not available - please configure it in the settings');
  }
}

// Book helpers
export async function saveBook(book) {
  const db = getDatabase('scurry_books');
  const bookId = `book_${book.hardcoverId}`;
  
  let doc;
  try {
    doc = await db.get(bookId);
    doc.title = book.title;
    doc.author = book.author || '';
    doc.updatedAt = new Date().toISOString();
  } catch (error) {
    if (error.statusCode === 404) {
      doc = {
        _id: bookId,
        hardcoverId: book.hardcoverId,
        title: book.title,
        author: book.author || '',
        status: 'wanted', // wanted, searching, downloaded, failed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSearched: null,
        downloadAttempts: 0
      };
    } else {
      throw error;
    }
  }
  
  await db.insert(doc);
  return doc;
}

export async function getAllBooks() {
  const db = getDatabase('scurry_books');
  try {
    const result = await db.list({ include_docs: true });
    return result.rows.map(row => row.doc);
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export async function updateBookStatus(hardcoverId, status, metadata = {}) {
  const db = getDatabase('scurry_books');
  const bookId = `book_${hardcoverId}`;
  
  try {
    const doc = await db.get(bookId);
    doc.status = status;
    doc.updatedAt = new Date().toISOString();
    
    if (metadata.lastSearched) {
      doc.lastSearched = metadata.lastSearched;
    }
    if (metadata.downloadAttempts !== undefined) {
      doc.downloadAttempts = metadata.downloadAttempts;
    }
    if (metadata.mamTorrentId) {
      doc.mamTorrentId = metadata.mamTorrentId;
    }
    
    await db.insert(doc);
    return doc;
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error(`Book with Hardcover ID ${hardcoverId} not found`);
    }
    throw error;
  }
}

// Download tracking helpers
export async function trackDownload(hardcoverId, mamTorrentId, source = 'auto') {
  const db = getDatabase('scurry_downloads');
  
  const downloadDoc = {
    _id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hardcoverId,
    mamTorrentId,
    source, // 'auto', 'manual', 'external'
    createdAt: new Date().toISOString()
  };
  
  await db.insert(downloadDoc);
  return downloadDoc;
}

export async function isBookDownloaded(hardcoverId) {
  const db = getDatabase('scurry_downloads');
  try {
    const result = await db.find({
      selector: { hardcoverId: hardcoverId },
      limit: 1
    });
    return result.docs.length > 0;
  } catch (error) {
    console.error('Error checking download status:', error);
    return false;
  }
}

export async function getAllDownloads() {
  const db = getDatabase('scurry_downloads');
  try {
    const result = await db.list({ include_docs: true });
    return result.rows.map(row => row.doc);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return [];
  }
}

// Book search and matching utilities
import "server-only";
import { config } from './config.js';
import { buildPayload, buildMamDownloadUrl, parseAuthorInfo } from './utilities.js';
import { MAM_BASE } from './constants.js';
import { trackDownload, updateBookStatus, getMamToken } from './database.js';

// Clean title for better matching
function cleanTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace non-word chars with spaces
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1, str2) {
  const clean1 = cleanTitle(str1);
  const clean2 = cleanTitle(str2);
  
  // Exact match
  if (clean1 === clean2) return 1.0;
  
  // Check if one contains the other
  if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.8;
  
  // Simple word matching
  const words1 = clean1.split(' ').filter(w => w.length > 2);
  const words2 = clean2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const matches = words1.filter(word => words2.includes(word));
  const score = matches.length / Math.max(words1.length, words2.length);
  
  return score;
}

// Calculate combined similarity score for title and author
function calculateBookSimilarity(bookTitle, bookAuthor, mamTitle, mamAuthor) {
  const titleScore = calculateSimilarity(bookTitle, mamTitle);
  const authorScore = bookAuthor && mamAuthor ? calculateSimilarity(bookAuthor, mamAuthor) : 0;
  
  // Weight title more heavily than author (70% title, 30% author)
  if (authorScore > 0) {
    return titleScore * 0.7 + authorScore * 0.3;
  } else {
    return titleScore;
  }
}

export async function searchMamForBook(bookTitle, bookAuthor = '') {
  const token = await getMamToken();
  if (!token) {
    throw new Error('MAM token not available');
  }

  // Create search query that includes both title and author if available
  let searchQuery = bookTitle;
  if (bookAuthor) {
    searchQuery = `${bookTitle} ${bookAuthor}`;
  }

  const res = await fetch(`${MAM_BASE}/tor/js/loadSearchJSONbasic.php`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Cookie": `mam_id=${token}`,
      "Origin": "https://www.myanonamouse.net",
      "Referer": "https://www.myanonamouse.net/"
    },
    body: JSON.stringify(buildPayload(searchQuery)),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`MAM search failed: ${res.status}`);
  }

  const data = await res.json();
  
  if (data.error) {
    return [];
  }

  // Map results and calculate similarity scores
  const results = data.data?.map(item => ({
    id: item.id ?? null,
    title: item.title ?? "",
    size: item.size ?? "",
    filetypes: item.filetype ?? "",
    addedDate: item.added ?? "",
    vip: Boolean(item.vip == 1),
    snatched: Boolean(item.my_snatched == 1),
    author: parseAuthorInfo(item.author_info),
    seeders: parseInt(item.seeders ?? 0),
    leechers: parseInt(item.leechers ?? 0),
    downloads: parseInt(item.times_completed ?? 0),
    downloadUrl: buildMamDownloadUrl(item.dl ?? ""),
    similarity: calculateBookSimilarity(
      bookTitle, 
      bookAuthor, 
      item.title ?? "", 
      parseAuthorInfo(item.author_info)
    )
  })) || [];

  // Sort by similarity score (descending) and seeders (descending)
  results.sort((a, b) => {
    if (Math.abs(a.similarity - b.similarity) > 0.1) {
      return b.similarity - a.similarity;
    }
    return b.seeders - a.seeders;
  });

  return results;
}

export async function findBestMatch(bookTitle, bookAuthor = '', minSimilarity = 0.7, minSeeders = 1) {
  const results = await searchMamForBook(bookTitle, bookAuthor);
  
  const bestMatch = results.find(result => 
    result.similarity >= minSimilarity && 
    result.seeders >= minSeeders &&
    !result.snatched
  );

  return bestMatch || null;
}

export async function autoDownloadBook(hardcoverId, bookTitle, bookAuthor = '') {
  try {
    // Update book status to searching
    await updateBookStatus(hardcoverId, 'searching', {
      lastSearched: new Date().toISOString()
    });

    const bestMatch = await findBestMatch(bookTitle, bookAuthor);
    
    if (!bestMatch) {
      // Update download attempts
      const book = await updateBookStatus(hardcoverId, 'wanted', {
        downloadAttempts: (await getBookDownloadAttempts(hardcoverId)) + 1
      });
      return { success: false, reason: 'No suitable match found', attempts: book.downloadAttempts };
    }

    // Add to qBittorrent
    const addResult = await addToQbittorrent(bestMatch.downloadUrl);
    
    if (addResult.success) {
      // Track download
      await trackDownload({
        hardcoverId,
        torrentId: bestMatch.id,
        torrentName: bestMatch.title,
        bookTitle,
        bookAuthor: bookAuthor || '',
        downloadUrl: bestMatch.downloadUrl,
        downloadedAt: new Date().toISOString()
      });
      
      // Update book status
      await updateBookStatus(hardcoverId, 'downloaded', {
        mamTorrentId: bestMatch.id
      });

      return { 
        success: true, 
        torrent: bestMatch,
        similarity: bestMatch.similarity
      };
    } else {
      await updateBookStatus(hardcoverId, 'failed', {
        downloadAttempts: (await getBookDownloadAttempts(hardcoverId)) + 1
      });
      return { success: false, reason: 'Failed to add to qBittorrent' };
    }
  } catch (error) {
    console.error(`Error auto-downloading book ${hardcoverId}:`, error);
    await updateBookStatus(hardcoverId, 'failed', {
      downloadAttempts: (await getBookDownloadAttempts(hardcoverId)) + 1
    });
    return { success: false, reason: error.message };
  }
}

async function getBookDownloadAttempts(hardcoverId) {
  const { getDatabase } = await import('./database.js');
  const db = getDatabase('scurry_books');
  try {
    const doc = await db.get(`book_${hardcoverId}`);
    return doc.downloadAttempts || 0;
  } catch (error) {
    return 0;
  }
}

async function addToQbittorrent(downloadUrl) {
  try {
    // TODO: I really dislike this import
    const { qbLogin, qbAddUrl } = await import('./qbittorrent.js');
    
    const cookie = await qbLogin();
    await qbAddUrl(config.qbUrl, cookie, downloadUrl, config.qbCategory);
    // TODO: the cookie logic can probably be internalized to the qbAddUrl call
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

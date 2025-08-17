// Cron job management for automatic book downloads
import "server-only";
import cron from 'node-cron';
import { getAllWantToReadBooks } from './hardcover.js';
import { saveBook, getAllBooks, isBookDownloaded } from './database.js';
import { autoDownloadBook } from './bookSearch.js';

let cronJob = null;

export function startBookDownloadCron() {
  if (cronJob) {
    console.log('Cron job already running');
    return;
  }

  // Run every 15 minutes
  cronJob = cron.schedule('*/15 * * * *', async () => {
    console.log('Running automatic book download check...');
    
    try {
      await processBookDownloads();
      console.log('Automatic book download check completed');
    } catch (error) {
      console.error('Error in automatic book download check:', error);
    }
  }, {
    scheduled: false // Don't start automatically
  });

  cronJob.start();
  console.log('Book download cron job started (every 15 minutes)');
}

export function stopBookDownloadCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Book download cron job stopped');
  }
}

export function isCronRunning() {
  return cronJob !== null;
}

async function processBookDownloads() {
  try {
    // 1. Fetch latest books from Hardcover
    const hardcoverBooks = await getAllWantToReadBooks();
    console.log(`Found ${hardcoverBooks.length} books on Hardcover want-to-read list`);

    // 2. Save/update books in our database
    for (const book of hardcoverBooks) {
      await saveBook(book);
    }

    // 3. Get all books from our database that need processing
    const allBooks = await getAllBooks();
    const booksToProcess = allBooks.filter(book => 
      book.status === 'wanted' && 
      book.downloadAttempts < 3 && // Don't retry failed downloads more than 3 times
      (!book.lastSearched || 
       new Date() - new Date(book.lastSearched) > 24 * 60 * 60 * 1000) // Wait 24 hours between search attempts
    );

    console.log(`Processing ${booksToProcess.length} books for automatic download`);

    // 4. Process each book (with some delay to be respectful)
    for (const book of booksToProcess) {
      try {
        // Check if already downloaded (could be downloaded externally)
        const alreadyDownloaded = await isBookDownloaded(book.hardcoverId);
        if (alreadyDownloaded) {
          console.log(`Book "${book.title}" already downloaded, skipping`);
          continue;
        }

        console.log(`Attempting auto-download for: "${book.title}" by ${book.author || 'Unknown'}`);
        const result = await autoDownloadBook(book.hardcoverId, book.title, book.author);
        
        if (result.success) {
          console.log(`✅ Successfully downloaded: "${book.title}" (similarity: ${result.similarity})`);
        } else {
          console.log(`❌ Failed to download: "${book.title}" - ${result.reason}`);
        }

        // Add delay between downloads to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      } catch (error) {
        console.error(`Error processing book "${book.title}":`, error);
      }
    }

  } catch (error) {
    console.error('Error in processBookDownloads:', error);
    throw error;
  }
}

// Manual trigger for the download process (for UI button)
export async function triggerManualBookSync() {
  console.log('Manual book sync triggered');
  return await processBookDownloads();
}

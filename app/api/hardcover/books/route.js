import { NextResponse } from "next/server";
import { getAllWantToReadBooks } from "@/src/lib/hardcover";
import { getAllBooks, saveBook, isBookDownloaded, getDatabase } from "@/src/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get books from our database with their status
    const localBooks = await getAllBooks();
    
    // Create a map for quick lookup
    const bookMap = new Map();
    localBooks.forEach(book => {
      bookMap.set(book.hardcoverId, book);
    });

    // Enrich with download status
    const enrichedBooks = await Promise.all(
      localBooks.map(async book => {
        const isDownloaded = await isBookDownloaded(book.hardcoverId);
        return {
          ...book,
          isDownloaded
        };
      })
    );

    return NextResponse.json({ books: enrichedBooks });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Sync books from Hardcover
    const hardcoverBooks = await getAllWantToReadBooks();
    
    // Save books to database
    const savedBooks = await Promise.all(
      hardcoverBooks.map(book => saveBook(book))
    );

    return NextResponse.json({ 
      message: `Synced ${savedBooks.length} books from Hardcover`,
      books: savedBooks 
    });
  } catch (error) {
    console.error('Error syncing books:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync books from Hardcover' },
      { status: 500 }
    );
  }
}

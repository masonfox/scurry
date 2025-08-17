import { NextResponse } from "next/server";
import { searchMamForBook } from "@/src/lib/bookSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const title = searchParams.get("title");
  const author = searchParams.get("author");
  
  if (!title) {
    return NextResponse.json(
      { error: 'Book title is required' },
      { status: 400 }
    );
  }

  try {
    const results = await searchMamForBook(title, author || '');
    
    return NextResponse.json({ 
      results,
      bookId 
    });
  } catch (error) {
    console.error('Error searching for book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search for book' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { autoDownloadBook } from "@/src/lib/bookSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { hardcoverId, title, author } = body;
    
    if (!hardcoverId || !title) {
      return NextResponse.json(
        { error: 'hardcoverId and title are required' },
        { status: 400 }
      );
    }

    const result = await autoDownloadBook(hardcoverId, title, author || '');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error auto-downloading book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download book' },
      { status: 500 }
    );
  }
}

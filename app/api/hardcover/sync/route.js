import { NextResponse } from "next/server";
import { triggerManualBookSync } from "@/src/lib/cronJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await triggerManualBookSync();
    
    return NextResponse.json({ 
      success: true,
      message: 'Manual book sync completed successfully'
    });
  } catch (error) {
    console.error('Error in manual book sync:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync books' },
      { status: 500 }
    );
  }
}

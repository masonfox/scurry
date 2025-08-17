// Health check endpoint - purely for status checking
import { NextResponse } from "next/server";
import { isCronRunning } from "@/src/lib/cronJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'healthy',
      cronRunning: isCronRunning(),
      cronEnabled: process.env.ENABLE_CRON === 'true',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}

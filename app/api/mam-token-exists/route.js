import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const location = config.mamTokenFile;
  try {
    const exists = fs.existsSync(config.mamTokenFile);
    console.log(`Success: MAM token file check (${location}) exists`);
    return NextResponse.json({ exists, location });
  } catch (e) {
    console.error(`Failed: MAM token file check (${location}): ${e.message}`);
    return NextResponse.json({ exists: false, error: e.message, location }, { status: 500 });
  }
}

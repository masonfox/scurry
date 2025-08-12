import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const location = config.mamTokenFile;
  try {
    if (fs.existsSync(config.mamTokenFile)) {
      return NextResponse.json({ exists: true, location });
    } else {
      return NextResponse.json({ exists: false, location });
    }
  } catch (e) {
    return NextResponse.json({ exists: false, error: e.message, location }, { status: 500 });
  }
}

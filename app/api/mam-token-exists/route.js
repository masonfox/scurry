import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (fs.existsSync(config.mamTokenFile)) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (e) {
    return NextResponse.json({ exists: false, error: e.message }, { status: 500 });
  }
}

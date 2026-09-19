import { NextResponse } from "next/server";
import { readSettingsSafe, writeSettings } from "@/src/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 * Returns current settings with the qBittorrent password masked.
 */
export async function GET() {
  try {
    const settings = readSettingsSafe();
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Failed to read settings:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to read settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Updates settings. If password equals the mask, existing password is preserved.
 */
export async function PUT(req) {
  try {
    const body = await req.json();
    const settings = body.settings;

    if (!settings) {
      return NextResponse.json(
        { ok: false, error: "No settings provided" },
        { status: 400 }
      );
    }

    writeSettings(settings);

    // Return the saved settings with masked password
    const safe = readSettingsSafe();
    return NextResponse.json({ ok: true, settings: safe });
  } catch (err) {
    console.error("Failed to write settings:", err.message);
    const status = err.message?.startsWith("Invalid settings") ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to save settings" },
      { status }
    );
  }
}

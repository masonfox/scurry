import { NextResponse } from "next/server";
import { readSettings } from "@/src/lib/settings";
import { PASSWORD_MASK } from "@/src/lib/constants";
import { qbLogin } from "@/src/lib/qbittorrent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/settings/test-connection
 * Tests qBittorrent connection with provided credentials.
 * If password is the mask string, uses the saved password.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    let { url, username, password } = body;

    if (!url?.trim() || !username?.trim() || !password) {
      return NextResponse.json(
        { ok: false, error: "URL, username, and password are required" },
        { status: 400 }
      );
    }

    // Validate URL scheme to prevent SSRF
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json(
          { ok: false, error: "URL must use http or https" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "URL is not valid" },
        { status: 400 }
      );
    }

    // If password is masked, read the real one from settings. Only do this
    // when testing the already-saved URL/username, so a masked password
    // can't be used to leak the real credentials to an arbitrary host.
    if (password === PASSWORD_MASK) {
      const settings = readSettings();
      if (
        url.trim() !== settings.qbittorrent.url ||
        username.trim() !== settings.qbittorrent.username
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Cannot use saved password with a different URL or username",
          },
          { status: 400 }
        );
      }
      password = settings.qbittorrent.password;
    }

    // Attempt login
    const cookie = await qbLogin(url.trim(), username.trim(), password);

    if (cookie) {
      return NextResponse.json({ ok: true, message: "Connection successful" });
    }

    return NextResponse.json(
      { ok: false, error: "Connection failed - no session received" },
      { status: 500 }
    );
  } catch (err) {
    console.error("qBittorrent connection test failed:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message || "Connection test failed" },
      { status: 500 }
    );
  }
}

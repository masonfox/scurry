import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import { qbAddUrl, qbLogin } from "@/src/lib/qbittorrent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  const title = body.title;
  const urlOrMagnet = body.downloadUrl;
  const category = body.category || config.qbCategory; // Use category from request or fallback to config
  if (!urlOrMagnet) {
    return NextResponse.json({ ok: false, error: "No magnet or torrentUrl provided" }, { status: 400 });
  }
  try {
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    // TODO: clean up params
    await qbAddUrl(config.qbUrl, cookie, urlOrMagnet, category);
    console.log(`Added to qBittorrent: ${title} (${category})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to add to qBittorrent: ${title} (${category}) - ${err?.message || err}`);
    return NextResponse.json({ ok: false, error: err?.message || "Add failed" }, { status: 500 });
  }
}

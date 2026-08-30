import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import { qbAddUrl, qbLogin } from "@/src/lib/qbittorrent";
import { bustStatsCache } from "../user-stats/route.js";
import { buildFLDownloadUrl } from "@/src/lib/utilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  const title = body.title;
  const downloadUrl = body.downloadUrl;
  const category = body.category || config.qbCategory; // Use category from request or fallback to config
  const useWedge = body.useWedge || false;
  
  if (!downloadUrl) {
    return NextResponse.json({ ok: false, error: "No magnet or torrentUrl provided" }, { status: 400 });
  }

  // When freeleech is requested, append &fl to the download URL.
  // This forces a personal freeleech on the download server-side without
  // requiring a separate bonusBuy API call (which is not allowed via API).
  const urlOrMagnet = useWedge ? (buildFLDownloadUrl(downloadUrl) ?? downloadUrl) : downloadUrl;
  
  try {
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    await qbAddUrl(config.qbUrl, cookie, urlOrMagnet, category);
    console.log(`Added to qBittorrent: ${title} (${category})${useWedge ? ' with FL (&fl)' : ''}`);
    
    // Bust user stats cache since download affects stats
    bustStatsCache();
    
    return NextResponse.json({ ok: true, wedgeUsed: useWedge });
  } catch (err) {
    console.error(`Failed to add to qBittorrent: ${title} (${category}) - ${err?.message || err}`);
    return NextResponse.json({ ok: false, error: err?.message || "Add failed" }, { status: 500 });
  }
}

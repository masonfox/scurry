import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import { qbAddUrl, qbLogin } from "@/src/lib/qbittorrent";
import { bustStatsCache } from "../user-stats/route.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  const title = body.title;
  const urlOrMagnet = body.downloadUrl;
  const torrentId = body.torrentId;
  const category = body.category || config.qbCategory; // Use category from request or fallback to config
  const useWedge = body.useWedge || false;
  
  if (!urlOrMagnet) {
    return NextResponse.json({ ok: false, error: "No magnet or torrentUrl provided" }, { status: 400 });
  }
  
  try {
    // If wedge is requested, purchase it first before adding torrent
    if (useWedge) {
      console.log(`Purchasing FL wedge for: ${title}`);
      
      const wedgeRes = await fetch(`${req.nextUrl.origin}/api/use-wedge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ torrentId })
      });

      const wedgeData = await wedgeRes.json();

      if (!wedgeRes.ok || !wedgeData.success) {
        const errorMsg = wedgeData.error || "Failed to purchase FL wedge";
        console.error(`FL wedge purchase failed for ${title}: ${errorMsg}`);
        return NextResponse.json(
          { ok: false, error: errorMsg, wedgeFailed: true },
          { status: wedgeRes.status }
        );
      }

      console.log(`FL wedge successfully applied for: ${title}`);
    }

    // Proceed with adding torrent to qBittorrent
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    // TODO: clean up params
    await qbAddUrl(config.qbUrl, cookie, urlOrMagnet, category);
    console.log(`Added to qBittorrent: ${title} (${category})${useWedge ? ' with FL wedge' : ''}`);
    
    // Bust user stats cache since download affects stats
    bustStatsCache();
    
    return NextResponse.json({ ok: true, wedgeUsed: useWedge });
  } catch (err) {
    console.error(`Failed to add to qBittorrent: ${title} (${category}) - ${err?.message || err}`);
    return NextResponse.json({ ok: false, error: err?.message || "Add failed" }, { status: 500 });
  }
}

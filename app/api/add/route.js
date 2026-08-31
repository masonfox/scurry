import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import { qbAddUrl, qbLogin } from "@/src/lib/qbittorrent";
import { bustStatsCache } from "../user-stats/route.js";
import { buildFLDownloadUrl } from "@/src/lib/utilities";
import { readSettings } from "@/src/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  const title = body.title;
  const downloadUrl = body.downloadUrl;
  const useWedge = body.useWedge || false;
  const tags = body.tags || []; // Array of tag strings
  
  if (!downloadUrl) {
    return NextResponse.json({ ok: false, error: "No magnet or torrentUrl provided" }, { status: 400 });
  }

  // When freeleech is requested, append &fl to the download URL.
  // This forces a personal freeleech on the download server-side without
  // requiring a separate bonusBuy API call (which is not allowed via API).
  const urlOrMagnet = useWedge ? (buildFLDownloadUrl(downloadUrl) ?? downloadUrl) : downloadUrl;
  
  // Read settings to determine category and tag behavior
  let settings;
  try {
    settings = readSettings();
  } catch {
    settings = null;
  }

  // Determine category: use settings if available, otherwise fall back to request/config
  let category;
  if (settings?.categories?.enabled) {
    // Use the category from the request body (client sends the right medium default)
    category = body.category || "";
  } else if (settings && !settings.categories?.enabled) {
    // Categories disabled in settings - don't assign a category
    category = "";
  } else {
    // No settings file - fall back to legacy behavior
    category = body.category || config.qbCategory;
  }

  // Determine tags: only pass if tags are enabled in settings
  let effectiveTags = [];
  if (settings?.tags?.enabled && Array.isArray(tags) && tags.length > 0) {
    effectiveTags = tags;
  }

  try {
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    await qbAddUrl(config.qbUrl, cookie, urlOrMagnet, {
      category: category || undefined,
      tags: effectiveTags.length > 0 ? effectiveTags : undefined,
    });
    
    const tagInfo = effectiveTags.length > 0 ? ` [tags: ${effectiveTags.join(", ")}]` : "";
    const catInfo = category ? ` (${category})` : "";
    console.log(`Added to qBittorrent: ${title}${catInfo}${tagInfo}${useWedge ? ' with FL (&fl)' : ''}`);
    
    // Bust user stats cache since download affects stats
    bustStatsCache();
    
    return NextResponse.json({ ok: true, wedgeUsed: useWedge });
  } catch (err) {
    console.error(`Failed to add to qBittorrent: ${title} - ${err?.message || err}`);
    return NextResponse.json({ ok: false, error: err?.message || "Add failed" }, { status: 500 });
  }
}

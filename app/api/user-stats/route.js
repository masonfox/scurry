import { NextResponse } from "next/server";
import { readMamToken } from "@/src/lib/config";
import { MAM_BASE } from "@/src/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory cache for user stats
const statsCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req) {
  try {
    const token = readMamToken();
    
    // Check cache first
    const cacheKey = token;
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("Returning cached user stats");
      return NextResponse.json({ stats: cached.data });
    }

    // Fetch from MAM
    const res = await fetch(`${MAM_BASE}/jsonLoad.php`, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Cookie": `mam_id=${token}`,
        "Origin": "https://www.myanonamouse.net",
        "Referer": "https://www.myanonamouse.net/"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      
      // Check for MAM token expiration
      if (res.status === 403 && text.toLowerCase().includes("you are not signed in")) {
        console.error("MAM token has expired");
        return NextResponse.json(
          { 
            error: `Your MAM token has expired or is invalid. Please update your token using the token manager.`,
            tokenExpired: true
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch user stats: ${res.status}` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      // If we can't parse JSON, check if it's an HTML response indicating token issues
      const text = await res.text().catch(() => "");
      if (text.toLowerCase().includes("html") || text.toLowerCase().includes("<!doctype")) {
        console.error("Detected HTML response, likely due to invalid/expired token");
        return NextResponse.json(
          { 
            error: `Your MAM token has expired or is invalid. Please update your token using the token manager.`,
            tokenExpired: true
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: "Invalid JSON from endpoint" }, { status: 502 });
    }

    // Extract user stats
    const stats = {
      uploaded: data.uploaded || "0 B",
      downloaded: data.downloaded || "0 B",
      ratio: data.ratio || "0.00",
      username: data.username || null,
      uid: data.uid || null
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: stats,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (statsCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of statsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) {
          statsCache.delete(key);
        }
      }
    }

    console.log(`Fetched user stats for ${stats.username}: ratio ${stats.ratio}`);

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}

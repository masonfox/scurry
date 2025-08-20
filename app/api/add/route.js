import { NextResponse } from "next/server";
import { config } from "@/src/lib/config";
import { qbAddUrl, qbLogin } from "@/src/lib/qbittorrent";
import { VALID_FRONTEND_CATEGORIES, FRONTEND_TO_QB_CATEGORY } from "@/src/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  const urlOrMagnet = body.downloadUrl;
  const requestedCategory = body.category;
  
  if (!urlOrMagnet) {
    return NextResponse.json({ ok: false, error: "No magnet or torrentUrl provided" }, { status: 400 });
  }

  // Validate and map category
  let qbCategory = config.qbCategory; // fallback to config default
  if (requestedCategory) {
    if (!VALID_FRONTEND_CATEGORIES.includes(requestedCategory)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid category: ${requestedCategory}. Valid categories: ${VALID_FRONTEND_CATEGORIES.join(', ')}` 
      }, { status: 400 });
    }
    qbCategory = FRONTEND_TO_QB_CATEGORY[requestedCategory];
  }

  try {
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    // TODO: clean up params
    await qbAddUrl(config.qbUrl, cookie, urlOrMagnet, qbCategory);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || "Add failed" }, { status: 500 });
  }
}

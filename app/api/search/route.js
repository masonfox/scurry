import { NextResponse } from "next/server";
import { config, readMamToken } from "@/src/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const MAM_BASE = "https://www.myanonamouse.net";

/**
 * Construct the search payload for MAM
 * @param {string} q - query value to search
 * @returns constructed request body
 */
function buildPayload(q) {
  return {
    tor: {
      text: q,
      srchIn: ["title", "author"],
      searchType: "all",
      main_cat: [14],
      browseFlagsHideVsShow: "0",
      sortType: "seedersDesc",
      startNumber: "0"
    },
    dlLink: "",
  };
}

export function buildMamDownloadUrl(dl) {
  if (!dl || typeof dl !== "string") return undefined;
  return `${MAM_BASE}/tor/download.php/${dl}`;
}

export function buildMamTorrentUrl(id) {
  if (!id || typeof id !== "string") return undefined;
  return `${MAM_BASE}/t/${id}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const token = readMamToken();

  const res = await fetch(`${MAM_BASE}/tor/js/loadSearchJSONbasic.php`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Cookie": `mam_id=${token}`,
      "Origin": "https://www.myanonamouse.net",
      "Referer": "https://www.myanonamouse.net/"
    },
    body: JSON.stringify(buildPayload(q)),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { results: [], error: `Search failed: ${res.status} ${text.slice(0, 200)}` },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ results: [], error: "Invalid JSON from endpoint" }, { status: 502 });
  }

  // if no data, return empty results
  if (data.error) {
    console.log("No results found");
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  // map the results to a simpler format
  const results = data.data.map(item => ({
    id: item.id,
    title: item.title,
    size: item.size,
    filetypes: item.filetype,
    addedDate: item.added,
    vip: item.vip == 1,
    snatched: item.my_snatched == 1,
    author: Object.values(JSON.parse(item.author_info))[0] || null,
    seeders: item.seeders.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    leechers: item.leechers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    downloads: item.times_completed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    downloadUrl: buildMamDownloadUrl(item.dl),
    torrentUrl: buildMamTorrentUrl(item.id.toString())
  }));

  return NextResponse.json({ results });
}

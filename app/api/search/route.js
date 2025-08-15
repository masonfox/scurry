import { NextResponse } from "next/server";
import { config, readMamToken } from "@/src/lib/config";
import { buildPayload, buildMamDownloadUrl, buildMamTorrentUrl, formatNumberWithCommas, parseAuthorInfo } from "@/src/lib/utilities";
import { MAM_BASE } from "@/src/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    id: item.id ?? null,
    title: item.title ?? "",
    size: item.size ?? "",
    filetypes: item.filetype ?? "",
    addedDate: item.added ?? "",
    vip: Boolean(item.vip == 1),
    snatched: Boolean(item.my_snatched == 1),
    author: parseAuthorInfo(item.author_info),
    seeders: formatNumberWithCommas(item.seeders ?? 0),
    leechers: formatNumberWithCommas(item.leechers ?? 0),
    downloads: formatNumberWithCommas(item.times_completed ?? 0),
    downloadUrl: buildMamDownloadUrl(item.dl ?? ""),
    torrentUrl: buildMamTorrentUrl((item.id ?? ""))
  }));

  return NextResponse.json({ results });
}

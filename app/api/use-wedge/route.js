import { NextResponse } from "next/server";
import { readMamToken } from "@/src/lib/config";
import { MAM_BASE } from "@/src/lib/constants";
import { generateTimestamp } from "@/src/lib/utilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { torrentId } = await req.json();
    
    if (!torrentId) {
      return NextResponse.json(
        { error: "Torrent ID is required" },
        { status: 400 }
      );
    }

    const token = readMamToken();
    const timestamp = generateTimestamp();

    // Call MAM bonus buy API to purchase freeleech wedge
    const wedgeUrl = `${MAM_BASE}/json/bonusBuy.php/${timestamp}?spendtype=personalFL&torrentid=${torrentId}&timestamp=${timestamp}`;
    
    console.log(`Attempting to use FL wedge for torrent ${torrentId}`);

    const res = await fetch(wedgeUrl, {
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
      console.error(`Failed to purchase FL wedge: ${res.status} - ${text}`);
      
      // Check for MAM token expiration
      if (res.status === 403 && text.toLowerCase().includes("you are not signed in")) {
        return NextResponse.json(
          { 
            error: "Your MAM token has expired or is invalid. Please update your token.",
            tokenExpired: true
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to purchase FL wedge: ${res.status}` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      console.error("Invalid JSON response from wedge purchase API:", text);
      return NextResponse.json(
        { error: "Invalid response from MAM API" },
        { status: 502 }
      );
    }

    // Check if the wedge purchase was successful
    // MAM API returns success: true/false and may include error message
    if (data.success === false || data.error) {
      const errorMsg = data.error || "Unknown error occurred";
      console.error(`FL wedge purchase failed: ${errorMsg}`);
      return NextResponse.json(
        { error: `Failed to use FL wedge: ${errorMsg}` },
        { status: 400 }
      );
    }

    console.log(`Successfully used FL wedge for torrent ${torrentId}`);

    return NextResponse.json({ 
      success: true,
      message: "FL wedge applied successfully",
      torrentId
    });
  } catch (err) {
    console.error("Error using FL wedge:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to use FL wedge" },
      { status: 500 }
    );
  }
}

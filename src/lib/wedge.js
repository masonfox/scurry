import "server-only";
import { readMamToken } from "./config.js";
import { MAM_BASE } from "./constants.js";
import { generateTimestamp } from "./utilities.js";

/**
 * Purchase a freeleech wedge for a torrent on MyAnonaMouse
 * @param {string|number} torrentId - The torrent ID to apply the wedge to
 * @returns {Promise<{success: boolean, error?: string, tokenExpired?: boolean, statusCode?: number, torrentId?: string}>}
 */
export async function purchaseFlWedge(torrentId) {
  try {
    // Validate torrentId
    if (!torrentId) {
      console.error("[Wedge Service] Validation failed: Torrent ID is required");
      return {
        success: false,
        error: "Torrent ID is required",
        statusCode: 400
      };
    }

    const token = readMamToken();
    const timestamp = generateTimestamp();

    // Call MAM bonus buy API to purchase freeleech wedge
    const wedgeUrl = `${MAM_BASE}/json/bonusBuy.php/${timestamp}?spendtype=personalFL&torrentid=${torrentId}&timestamp=${timestamp}`;
    
    console.log(`[Wedge Service] Attempting to use FL wedge for torrent ${torrentId}`);

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
      console.error(`[Wedge Service] Failed to purchase FL wedge: ${res.status} - ${text.slice(0, 200)}`);
      
      // Check for MAM token expiration
      if (res.status === 403 && text.toLowerCase().includes("you are not signed in")) {
        console.error(`[Wedge Service] MAM token has expired for torrent ${torrentId}`);
        return {
          success: false,
          error: "Your MAM token has expired or is invalid. Please update your token.",
          tokenExpired: true,
          statusCode: 401
        };
      }
      
      return {
        success: false,
        error: `Failed to purchase FL wedge: ${res.status}`,
        statusCode: 502
      };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      console.error(`[Wedge Service] Invalid JSON response from wedge purchase API for torrent ${torrentId}:`, text.slice(0, 200));
      return {
        success: false,
        error: "Invalid response from MAM API",
        statusCode: 502
      };
    }

    // Check if the wedge purchase was successful
    // MAM API returns success: true/false and may include error message
    if (data.success === false || data.error) {
      const errorMsg = data.error || "Unknown error occurred";
      console.error(`[Wedge Service] FL wedge purchase failed for torrent ${torrentId}: ${errorMsg}`);
      return {
        success: false,
        error: `Failed to use FL wedge: ${errorMsg}`,
        statusCode: 400
      };
    }

    console.log(`[Wedge Service] Successfully used FL wedge for torrent ${torrentId}`);

    return { 
      success: true,
      torrentId: String(torrentId)
    };
  } catch (err) {
    console.error(`[Wedge Service] Error using FL wedge for torrent ${torrentId}:`, err);
    return {
      success: false,
      error: err?.message || "Failed to use FL wedge",
      statusCode: 500
    };
  }
}

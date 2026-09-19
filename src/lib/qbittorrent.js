import "server-only";

/** Cookie-based qBittorrent login */
export async function qbLogin(baseUrl, username, password) {
  const url = new URL("/api/v2/auth/login", baseUrl);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": baseUrl
    },
    body: new URLSearchParams({ username, password })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`qBittorrent login failed: ${res.status} ${text}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  if (!cookie) throw new Error("No session cookie received from qBittorrent");
  return cookie;
}

/**
 * Add a torrent URL to qBittorrent.
 * @param {string} baseUrl - qBittorrent base URL
 * @param {string} cookie - Session cookie from qbLogin
 * @param {string} torrentUrl - Magnet or torrent URL
 * @param {object} options - Optional parameters
 * @param {string} [options.category] - qBittorrent category (omitted if empty/null)
 * @param {string[]} [options.tags] - Array of tag names to apply
 */
export async function qbAddUrl(baseUrl, cookie, torrentUrl, options = {}) {
  const url = new URL("/api/v2/torrents/add", baseUrl);

  const body = new URLSearchParams();
  body.set("urls", String(torrentUrl).trim());

  // Support both old-style positional category and new options object
  const category = typeof options === "string" ? options : options.category;
  const tags = typeof options === "string" ? undefined : options.tags;

  if (category) {
    body.set("category", String(category).trim());
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    body.set("tags", tags.join(","));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Cookie": cookie,
      "Referer": baseUrl,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`qBittorrent add failed: ${res.status} ${text}`);
  }
  return true;
}

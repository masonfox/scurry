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

// TODO: clean up params
export async function qbAddUrl(baseUrl, cookie, torrentUrl, category) {
  const url = new URL("/api/v2/torrents/add", baseUrl);

  const body = new URLSearchParams();

  body.set("urls", String(torrentUrl).trim());
  body.set("category", String(category).trim());

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

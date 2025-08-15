import { MAM_BASE } from "./constants.js";
/**
 * Construct the search payload for MAM
 * @param {string} q - query value to search
 * @returns constructed request body
 */
export function buildPayload(q) {
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
  if (!dl || typeof dl !== "string") return null;
  return `${MAM_BASE}/tor/download.php/${dl}`;
}

export function buildMamTorrentUrl(id) {
  if (!id) return null;
  return `${MAM_BASE}/t/${id}`;
}

export function formatNumberWithCommas(num) {
  if (num == null || isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseAuthorInfo(authorInfo) {
  try {
    const parsed = JSON.parse(authorInfo ?? '{}');
    const values = Object.values(parsed);
    return values.length > 0 ? values[0] : null;
  } catch {
    return null;
  }
}

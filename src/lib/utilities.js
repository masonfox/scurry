import { MAM_BASE, MAM_CATEGORIES } from "./constants.js";
/**
 * Construct the search payload for MAM
 * @param {string} q - query value to search
 * @param {number} categoryId - MAM category ID (default: books)
 * @returns constructed request body
 */
export function buildPayload(q, categoryId = MAM_CATEGORIES.BOOKS) {
  return {
    tor: {
      text: q,
      srchIn: ["title", "author"],
      searchType: "all",
      main_cat: [categoryId],
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

/**
 * Validate a MAM API token format
 * @param {string} token - The token to validate
 * @returns {boolean} - Whether the token appears to be valid format
 */
export function validateMamToken(token) {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  // MAM tokens are typically long base64-like strings
  return trimmed.length > 50 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}

/**
 * Mask a token for display purposes
 * @param {string} token - The token to mask
 * @returns {string} - Masked token showing only first/last chars
 */
export function maskToken(token) {
  if (!token || typeof token !== "string") return "";
  const trimmed = token.trim();
  if (trimmed.length <= 10) return "***";
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

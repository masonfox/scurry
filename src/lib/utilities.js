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

/**
 * Parse a size string (e.g., "45.2 MB", "1.5 GB", "2.4 MiB") to bytes
 * @param {string} sizeString - The size string to parse
 * @returns {number|null} - Size in bytes, or null if invalid
 */
export function parseSizeToBytes(sizeString) {
  if (!sizeString || typeof sizeString !== "string") return null;
  
  // Handle edge cases
  const trimmed = sizeString.trim().toUpperCase();
  if (trimmed === "" || trimmed === "0" || trimmed === "0 B") return 0;
  if (trimmed.startsWith("< ")) return 0; // "< 1 KB" → 0
  
  // Parse number and unit - support both binary (KiB) and decimal (KB) units
  const match = trimmed.match(/^([\d,.]+)\s*([KMGT]?I?B)$/);
  if (!match) return null;
  
  const value = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2];
  
  if (isNaN(value)) return null;
  
  // Convert to bytes (using binary multipliers as MAM uses IEC units)
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'KIB': 1024,
    'MB': 1024 * 1024,
    'MIB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'GIB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
    'TIB': 1024 * 1024 * 1024 * 1024
  };
  
  return Math.round(value * (multipliers[unit] || 1));
}

/**
 * Format bytes to a human-readable size string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted size string (e.g., "45.2 MB")
 */
export function formatBytesToSize(bytes) {
  if (bytes == null || isNaN(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);
  
  return `${(bytes / Math.pow(k, unitIndex)).toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Calculates new ratio after downloading additional bytes
 * @param {number} uploadedBytes - Current uploaded bytes
 * @param {number} downloadedBytes - Current downloaded bytes
 * @param {number} additionalBytes - Additional bytes to download
 * @returns {string|null} - New ratio as string, or null if invalid
 */
export function calculateNewRatio(uploadedBytes, downloadedBytes, additionalBytes) {
  if (uploadedBytes == null || downloadedBytes == null || additionalBytes == null) return null;
  if (isNaN(uploadedBytes) || isNaN(downloadedBytes) || isNaN(additionalBytes)) return null;
  
  const newDownloaded = downloadedBytes + additionalBytes;
  
  // Handle division by zero
  if (newDownloaded === 0) {
    return uploadedBytes > 0 ? "∞" : "0.0000";
  }
  
  const ratio = uploadedBytes / newDownloaded;
  return ratio.toFixed(4);
}

/**
 * Calculates the difference between new ratio and current ratio
 * @param {number} uploadedBytes - Current uploaded bytes
 * @param {number} downloadedBytes - Current downloaded bytes
 * @param {number} additionalBytes - Additional bytes to download
 * @returns {string|null} - Difference as string with 4 decimal places, or null if invalid
 */
export function calculateRatioDiff(uploadedBytes, downloadedBytes, additionalBytes) {
  if (uploadedBytes == null || downloadedBytes == null || additionalBytes == null) return null;
  if (isNaN(uploadedBytes) || isNaN(downloadedBytes) || isNaN(additionalBytes)) return null;
  if (downloadedBytes === 0) return null;
  
  const currentRatio = uploadedBytes / downloadedBytes;
  const newRatio = calculateNewRatio(uploadedBytes, downloadedBytes, additionalBytes);
  
  if (newRatio === null) return null;
  
  const diff = parseFloat(newRatio) - currentRatio;
  return diff.toFixed(4);
}

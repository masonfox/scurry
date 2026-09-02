// Settings persistence module
import "server-only";
import fs from "node:fs";
import { SETTINGS_FILE, PASSWORD_MASK } from "./constants.js";

/**
 * Returns the default settings schema.
 * These are used when no settings file exists yet.
 */
export function getDefaults() {
  return {
    qbittorrent: {
      url: process.env.APP_QB_URL || "http://qbittorrent:8080",
      username: process.env.APP_QB_USERNAME || "admin",
      password: process.env.APP_QB_PASSWORD || "adminadmin",
    },
    tags: {
      enabled: false,
      available: [],
      defaults: {
        books: [],
        audiobooks: [],
      },
    },
    categories: {
      enabled: false,
      defaults: {
        books: "books",
        audiobooks: "audiobooks",
      },
    },
    wedges: {
      enabled: false,
      thresholds: {
        books: { value: null, unit: "MB" },
        audiobooks: { value: null, unit: "MB" },
      },
    },
  };
}

/**
 * Reads settings from disk.
 * Returns defaults seeded from env vars if no file exists.
 */
export function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      const saved = JSON.parse(raw);
      // Merge with defaults to ensure any new keys are present
      const defaults = getDefaults();
      return deepMerge(defaults, saved);
    }
  } catch (err) {
    console.warn("Failed to read settings file, using defaults:", err.message);
  }
  return getDefaults();
}

/**
 * Returns settings with the qBittorrent password masked.
 * Safe to return from API endpoints.
 */
export function readSettingsSafe() {
  const settings = readSettings();
  return {
    ...settings,
    qbittorrent: {
      ...settings.qbittorrent,
      password: PASSWORD_MASK,
    },
  };
}

/**
 * Writes settings to disk.
 * If the password field equals the mask, preserves the existing password.
 */
export function writeSettings(settings) {
  const errors = validateSettings(settings);
  if (errors.length > 0) {
    throw new Error(`Invalid settings: ${errors.join(", ")}`);
  }

  // Clone to avoid mutating the caller's object
  const toWrite = {
    ...settings,
    qbittorrent: { ...settings.qbittorrent },
  };

  // If password is the mask string, keep the existing password
  if (toWrite.qbittorrent?.password === PASSWORD_MASK) {
    const existing = readSettings();
    toWrite.qbittorrent.password = existing.qbittorrent.password;
  }

  // Ensure the config directory exists
  const dir = SETTINGS_FILE.substring(0, SETTINGS_FILE.lastIndexOf("/"));
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(toWrite, null, 2), "utf8");
  return toWrite;
}

/**
 * Validates settings object. Returns an array of error messages (empty = valid).
 */
export function validateSettings(settings) {
  const errors = [];

  // qBittorrent
  if (!settings.qbittorrent?.url?.trim()) {
    errors.push("qBittorrent URL is required");
  } else {
    try {
      const parsed = new URL(settings.qbittorrent.url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push("qBittorrent URL must use http or https");
      }
    } catch {
      errors.push("qBittorrent URL is not a valid URL");
    }
  }
  if (!settings.qbittorrent?.username?.trim()) {
    errors.push("qBittorrent username is required");
  }
  if (!settings.qbittorrent?.password) {
    errors.push("qBittorrent password is required");
  }

  // Tags
  if (settings.tags) {
    if (settings.tags.available && Array.isArray(settings.tags.available)) {
      for (const tag of settings.tags.available) {
        if (typeof tag !== "string" || !tag.trim()) {
          errors.push("Tag names must be non-empty strings");
          break;
        }
        if (tag.length > 50) {
          errors.push(`Tag "${tag}" exceeds 50 character limit`);
        }
      }
    }
    // Validate defaults reference available tags
    if (settings.tags.defaults) {
      const available = settings.tags.available || [];
      for (const medium of ["books", "audiobooks"]) {
        const defs = settings.tags.defaults[medium];
        if (Array.isArray(defs)) {
          for (const def of defs) {
            if (def && !available.includes(def)) {
              errors.push(`Default tag "${def}" for ${medium} is not in available tags`);
            }
          }
        } else if (defs && typeof defs === "string") {
          // Legacy single-string format
          if (!available.includes(defs)) {
            errors.push(`Default tag "${defs}" for ${medium} is not in available tags`);
          }
        }
      }
    }
  }

  // Categories
  if (settings.categories?.defaults) {
    for (const medium of ["books", "audiobooks"]) {
      const cat = settings.categories.defaults[medium];
      if (cat && (typeof cat !== "string" || cat.length > 50)) {
        errors.push(`Category for ${medium} must be a string under 50 characters`);
      }
    }
  }

  // Wedges
  if (settings.wedges?.thresholds) {
    for (const medium of ["books", "audiobooks"]) {
      const threshold = settings.wedges.thresholds[medium];
      if (!threshold) continue;
      const { value, unit } = threshold;
      if (value !== null && value !== undefined) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          errors.push(`Wedge threshold for ${medium} must be zero or a positive number`);
        }
      }
      if (unit !== undefined && unit !== "KB" && unit !== "MB" && unit !== "GB") {
        errors.push(`Wedge threshold unit for ${medium} must be "KB", "MB", or "GB"`);
      }
    }
  }

  return errors;
}

/**
 * Deep merge utility. Target values are overwritten by source values.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Core configuration logic (shared between Next.js and MCP server)
import fs from "node:fs";
import { MAM_TOKEN_FILE } from "./constants.js";

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const cfg = {
  appPassword: process.env.APP_PASSWORD || "cheese",
  qbUrl: need("APP_QB_URL"),
  qbCategory: process.env.APP_QB_CATEGORY || "books",
  qbUser: process.env.APP_QB_USERNAME || "admin",
  qbPass: process.env.APP_QB_PASSWORD || "adminadmin",
  mamUA: process.env.APP_MAM_USER_AGENT || "Scurry/1.0 (+contact)",
};

/**
 * Read MAM token from file
 * @param {boolean} throwOnError - If true, throws on error. If false, returns null on error.
 * @returns {string|null} The MAM token or null if error and throwOnError is false
 */
export function readMamToken(throwOnError = true) {
  try {
    return fs.readFileSync(MAM_TOKEN_FILE, "utf8").trim();
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
    console.error(`Error reading MAM token from ${MAM_TOKEN_FILE}:`, error.message);
    return null;
  }
}

export const config = cfg;

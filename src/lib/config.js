// App configuration
import "server-only";
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
  mouseholeEnabled: process.env.MOUSEHOLE_ENABLED === "true",
  mouseholeStateFile: process.env.MOUSEHOLE_STATE_FILE || "secrets/state.json",
};

export function readMamToken() {
  if (cfg.mouseholeEnabled) {
    try {
      const stateFile = cfg.mouseholeStateFile;
      if (!fs.existsSync(stateFile)) {
        console.warn(`Mousehole state file not found at ${stateFile}, falling back to static token`);
      } else {
        const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
        // URL-decode the token from mousehole's format
        return decodeURIComponent(state.currentCookie);
      }
    } catch (err) {
      console.warn("Failed to read from mousehole, falling back to static token:", err.message);
    }
  }
  return fs.readFileSync(MAM_TOKEN_FILE, "utf8").trim();
}

export function isMouseholeMode() {
  return cfg.mouseholeEnabled;
}

export const config = cfg;

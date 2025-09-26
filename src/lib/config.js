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
};

export function readMamToken() {
  return fs.readFileSync(MAM_TOKEN_FILE, "utf8").trim();
}

export const config = cfg;

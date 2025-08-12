import "server-only";
import fs from "node:fs";

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const cfg = {
  qbUrl: need("APP_QB_URL"),
  qbCategory: "books",
  qbUser: process.env.APP_QB_USERNAME || "admin",
  qbPass: process.env.APP_QB_PASSWORD || "adminadmin",

  mamTokenFile: "secrets/mam_api_token",
  mamUA: process.env.APP_MAM_USER_AGENT || "Scurry/1.0 (+contact)",
};

export function readMamToken() {
  return fs.readFileSync(cfg.mamTokenFile, "utf8").trim() || null;
}

export const config = cfg;

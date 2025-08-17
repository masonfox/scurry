// App configuration
import "server-only";

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

  couchdbUrl: process.env.COUCHDB_URL || "http://localhost:5984",
  couchdbUser: process.env.COUCHDB_USER || "admin",
  couchdbPassword: process.env.COUCHDB_PASSWORD || "password",
};

export const config = cfg;

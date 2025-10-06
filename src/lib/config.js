// App configuration (Next.js server-only wrapper)
import "server-only";
import { config as coreConfig, readMamToken as coreReadMamToken } from "./config-core.js";

// Re-export core functionality with server-only protection
export const config = coreConfig;

/**
 * Read MAM token from file (throws on error for Next.js routes)
 * @returns {string} The MAM token
 */
export function readMamToken() {
  return coreReadMamToken(true); // throwOnError = true for Next.js
}

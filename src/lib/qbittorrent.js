// qBittorrent functions (Next.js server-only wrapper)
import "server-only";
import { qbLogin as coreQbLogin, qbAddUrl as coreQbAddUrl } from "./qbittorrent-core.js";

// Re-export core functionality with server-only protection
export const qbLogin = coreQbLogin;
export const qbAddUrl = coreQbAddUrl;

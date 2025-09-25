// MAM base url
export const MAM_BASE = "https://www.myanonamouse.net";

// Shared constants for the app
export const SESSION_COOKIE = 'scurry_session';

// Paths that are always allowed through middleware
export const ALLOWED_PATHS = ['/api', '/_next', '/favicon.ico', '/apple-icon.png', '/images'];

// MAM categories
export const MAM_CATEGORIES = {
  BOOKS: 14,
  AUDIOBOOKS: 13
};

// qBittorrent categories mapping
export const QBITTORRENT_CATEGORIES = {
  [MAM_CATEGORIES.BOOKS]: 'books',
  [MAM_CATEGORIES.AUDIOBOOKS]: 'audiobooks'
};

// MAM token file path
export const MAM_TOKEN_FILE = "secrets/mam_api_token";

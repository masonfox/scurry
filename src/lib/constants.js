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

// Frontend category constants (what users see)
export const FRONTEND_CATEGORIES = {
  BOOKS: 'books',
  AUDIOBOOKS: 'audiobooks'
};

// Valid frontend category values for validation
export const VALID_FRONTEND_CATEGORIES = Object.values(FRONTEND_CATEGORIES);

// Mapping from frontend category to MAM category ID
export const FRONTEND_TO_MAM_CATEGORY = {
  [FRONTEND_CATEGORIES.BOOKS]: MAM_CATEGORIES.BOOKS,
  [FRONTEND_CATEGORIES.AUDIOBOOKS]: MAM_CATEGORIES.AUDIOBOOKS
};

// Mapping from frontend category to qBittorrent category
export const FRONTEND_TO_QB_CATEGORY = {
  [FRONTEND_CATEGORIES.BOOKS]: 'books',
  [FRONTEND_CATEGORIES.AUDIOBOOKS]: 'audiobooks'
};

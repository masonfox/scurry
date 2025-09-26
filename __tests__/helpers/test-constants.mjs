// Test constants to reduce magic values and improve maintainability
export const TEST_CONFIG = {
  // qBittorrent test config
  QB_URL: 'http://localhost:8080',
  QB_USER: 'testuser',
  QB_PASS: 'testpass',
  QB_CATEGORY: 'books',
  
  // MAM test config
  MAM_TOKEN: 'test-mam-token-12345',
  MAM_TOKEN_FILE: 'secrets/mam_api_token',
  
  // Common test data
  SESSION_COOKIE: 'SID=test-session-12345; Path=/; HttpOnly',
  BASE_URL: 'http://localhost'
};

export const MOCK_RESPONSES = {
  // Success response templates
  SUCCESSFUL_LOGIN: {
    ok: true,
    status: 200,
    headers: { get: () => TEST_CONFIG.SESSION_COOKIE },
    text: async () => ''
  },
  
  SUCCESSFUL_ADD: {
    ok: true,
    status: 200,
    text: async () => ''
  },
  
  // Error response templates
  UNAUTHORIZED: {
    ok: false,
    status: 401,
    text: async () => 'Unauthorized'
  },
  
  RATE_LIMITED: {
    ok: false,
    status: 429,
    text: async () => 'Rate limit exceeded'
  },
  
  SERVER_ERROR: {
    ok: false,
    status: 500,
    text: async () => 'Internal Server Error'
  },
  
  NETWORK_TIMEOUT: new Error('Network timeout'),
  
  QB_UNAVAILABLE: new Error('Connection refused - qBittorrent not available'),
  
  INVALID_JSON: {
    ok: true,
    status: 200,
    json: async () => { throw new Error('Invalid JSON'); },
    text: async () => 'Invalid response'
  }
};

export const EXPECTED_ERRORS = {
  TOKEN_EXPIRED: 'Your MAM token has expired or is invalid. Please update your token using the token manager.',
  NO_DOWNLOAD_URL: 'No magnet or torrentUrl provided',
  SEARCH_FAILED_500: 'Search failed: 500',
  SEARCH_FAILED_429: 'Search failed: 429',
  INVALID_JSON_ENDPOINT: 'Invalid JSON from endpoint'
};

export const CATEGORIES = {
  BOOKS: 'books',
  AUDIOBOOKS: 'audiobooks',
  FICTION: 'fiction',
  NON_FICTION: 'non-fiction',
  TEXTBOOKS: 'textbooks'
};

export const FILE_TYPES = {
  EPUB: 'epub',
  PDF: 'pdf',
  M4B: 'm4b',
  MP3: 'mp3'
};
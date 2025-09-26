import { buildMamDownloadUrl, buildMamTorrentUrl } from '../../src/lib/utilities.js';

/**
 * Factory for creating MAM torrent data with sensible defaults
 */
export function createMamTorrent(overrides = {}) {
  const defaults = {
    id: '12345',
    dl: 'test-download-link-abc123',
    title: 'Test Book Title',
    size: '2.5 MB',
    filetype: 'epub',
    added: '2025-09-25',
    vip: 0,
    my_snatched: 0,
    author_info: '{"author":"Test Author"}',
    seeders: 15,
    leechers: 3,
    times_completed: 25
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Factory for creating MAM API responses
 */
export function createMamResponse(torrents = [createMamTorrent()], overrides = {}) {
  const defaults = {
    ok: true,
    status: 200,
    json: async () => ({ data: torrents }),
    text: async () => ""
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Factory for creating error responses
 */
export function createErrorResponse(status, message, overrides = {}) {
  const defaults = {
    ok: false,
    status,
    text: async () => message,
    json: async () => ({})
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Factory for creating search requests
 */
export function createSearchRequest(query = 'test', category = 'books') {
  return {
    url: `http://localhost/api/search?q=${encodeURIComponent(query)}&category=${category}`
  };
}

/**
 * Factory for creating download requests
 */
export function createDownloadRequest(data = {}) {
  const defaults = {
    title: 'Test Book',
    downloadUrl: buildMamDownloadUrl('test-download-link'),
    category: 'books'
  };
  
  return {
    json: async () => ({ ...defaults, ...data })
  };
}

/**
 * Factory for creating popular torrents (high seeders/downloads)
 */
export function createPopularTorrent(overrides = {}) {
  return createMamTorrent({
    seeders: 150,
    leechers: 25,
    times_completed: 600,
    vip: 1,
    ...overrides
  });
}

/**
 * Factory for creating rare torrents (low availability)
 */
export function createRareTorrent(overrides = {}) {
  return createMamTorrent({
    seeders: 1,
    leechers: 0,
    times_completed: 2,
    size: '0.8 MB',
    title: 'Rare Obscure Book',
    author_info: '{"author":"Obscure Author"}',
    ...overrides
  });
}

/**
 * Factory for creating audiobook torrents
 */
export function createAudiobookTorrent(overrides = {}) {
  return createMamTorrent({
    size: '450 MB',
    filetype: 'm4b',
    title: 'Fantasy Audiobook',
    author_info: '{"author":"Audio Author"}',
    seeders: 10,
    leechers: 2,
    times_completed: 15,
    ...overrides
  });
}

/**
 * Factory for creating torrents with malformed data
 */
export function createMalformedTorrent(overrides = {}) {
  return createMamTorrent({
    title: null,
    size: undefined,
    filetype: '',
    author_info: 'not-json-at-all',
    seeders: null,
    ...overrides
  });
}

/**
 * Create multiple torrents at once
 */
export function createTorrents(count, factory = createMamTorrent) {
  return Array.from({ length: count }, (_, i) => 
    factory({ id: `${12345 + i}`, dl: `test-link-${i}` })
  );
}
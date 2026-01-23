import { describe, it, expect, vi } from 'vitest';
import { GET } from '../app/api/search/route.js';
import { buildMamDownloadUrl, buildMamTorrentUrl } from '../src/lib/utilities.js';

// Mock fetch and dependencies
vi.mock('../src/lib/config', () => ({
  readMamToken: vi.fn(() => 'fake-token'),
  config: { 
    qbUrl: '', 
    qbUser: '', 
    qbPass: '', 
    qbCategory: '',
    mamTokenFile: 'secrets/mam_api_token'
  }
}));

global.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({ results: [{ id: '123', dl: 'abc' }], data: [{ id: '123', dl: 'abc', title: 'Test', size: '1MB', filetype: 'epub', added: '2025-08-14', vip: 0, my_snatched: 0, author_info: '{"author":"Author"}', seeders: 10, leechers: 2, times_completed: 5 }]}),
  text: async () => "",
}));

describe('search route', () => {
  it('returns empty results for empty query', async () => {
    const req = { url: 'http://localhost/api/search?q=' };
    const res = await GET(req);
    const json = await res.json();
    expect(json).toEqual({ results: [] });
  });

  it('returns results for valid query', async () => {
    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();
    expect(json.results.length).toBeGreaterThan(0);
  });
});

describe('token expiration handling', () => {
  beforeEach(() => {
    // Reset the mock before each test
    global.fetch.mockClear();
  });

  it('returns 401 with tokenExpired flag for 403 "not signed in" response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () => "Error, you are not signed in <br />Other error"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.tokenExpired).toBe(true);
    expect(json.error).toBe('Your MAM token has expired or is invalid. Please update your token using the token manager.');
    expect(json.results).toEqual([]);
  });

  it('returns 401 with tokenExpired flag for HTML response (Cloudflare scenario)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => "<!DOCTYPE html><html><head><title>Error</title></head><body>Bad gateway</body></html>"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.tokenExpired).toBe(true);
    expect(json.error).toBe('Your MAM token has expired or is invalid. Please update your token using the token manager.');
    expect(json.results).toEqual([]);
  });

  it('returns 401 with tokenExpired flag for lowercase html response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => "<html><body>Some html content</body></html>"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.tokenExpired).toBe(true);
    expect(json.error).toBe('Your MAM token has expired or is invalid. Please update your token using the token manager.');
    expect(json.results).toEqual([]);
  });

  it('returns 502 for 403 without "not signed in" message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () => "Forbidden - some other error"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.tokenExpired).toBeUndefined();
    expect(json.error).toBe('Search failed: 403 Forbidden - some other error');
    expect(json.results).toEqual([]);
  });

  it('returns 502 for non-HTML JSON parse errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => "Invalid JSON response"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.tokenExpired).toBeUndefined();
    expect(json.error).toBe('Invalid JSON from endpoint');
    expect(json.results).toEqual([]);
  });

  it('handles case-insensitive "not signed in" detection', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () => "ERROR, YOU ARE NOT SIGNED IN <BR />OTHER ERROR"
    });

    const req = { url: 'http://localhost/api/search?q=test' };
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.tokenExpired).toBe(true);
    expect(json.error).toBe('Your MAM token has expired or is invalid. Please update your token using the token manager.');
  });
});

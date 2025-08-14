import { describe, it, expect } from '@jest/globals';
import { GET, buildMamDownloadUrl, buildMamTorrentUrl } from '../app/api/search/route.js';

// Mock fetch and dependencies
jest.mock('../src/lib/config', () => ({
  readMamToken: jest.fn(() => 'fake-token'),
  config: { qbUrl: '', qbUser: '', qbPass: '', qbCategory: '' }
}));

global.fetch = jest.fn(async () => ({
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

  it('buildMamDownloadUrl returns correct url', () => {
    expect(buildMamDownloadUrl('abc')).toContain('/tor/download.php/abc');
    expect(buildMamDownloadUrl()).toBeUndefined();
  });

  it('buildMamTorrentUrl returns correct url', () => {
    expect(buildMamTorrentUrl('123')).toContain('/t/123');
    expect(buildMamTorrentUrl()).toBeUndefined();
  });
});

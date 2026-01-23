import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/add/route.js';
import * as qbittorrent from '../src/lib/qbittorrent';
import * as userStatsRoute from '../app/api/user-stats/route.js';

vi.mock('../src/lib/config', () => ({
  config: { qbUrl: 'http://qb', qbUser: 'user', qbPass: 'pass', qbCategory: 'cat' }
}));
vi.mock('../src/lib/qbittorrent', () => ({
  qbLogin: vi.fn(async () => 'cookie'),
  qbAddUrl: vi.fn(async () => true)
}));
vi.mock('../app/api/user-stats/route.js', () => ({
  bustStatsCache: vi.fn()
}));

describe('add route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if no downloadUrl provided', async () => {
    const req = { json: async () => ({}) };
    const res = await POST(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/No magnet or torrentUrl provided/);
  });

  it('returns ok true for valid downloadUrl', async () => {
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    const res = await POST(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('busts stats cache after successful download', async () => {
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.ok).toBe(true);
    expect(userStatsRoute.bustStatsCache).toHaveBeenCalledTimes(1);
  });

  it('returns 500 if qbittorrent throws', async () => {
    qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw new Error('fail'); });
    
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/fail/);
  });

  it('does not bust cache if download fails', async () => {
    qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw new Error('fail'); });
    
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    await POST(req);
    
    expect(userStatsRoute.bustStatsCache).not.toHaveBeenCalled();
  });
});

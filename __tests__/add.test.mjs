import { describe, it, expect, vi } from 'vitest';
import { POST } from '../app/api/add/route.js';
import * as qbittorrent from '../src/lib/qbittorrent';

vi.mock('../src/lib/config', () => ({
  config: { qbUrl: 'http://qb', qbUser: 'user', qbPass: 'pass', qbCategory: 'cat' }
}));
vi.mock('../src/lib/qbittorrent', () => ({
  qbLogin: vi.fn(async () => 'cookie'),
  qbAddUrl: vi.fn(async () => true)
}));

describe('add route', () => {
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

  it('returns 500 if qbittorrent throws', async () => {
    qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw new Error('fail'); });
    
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/fail/);
  });
});

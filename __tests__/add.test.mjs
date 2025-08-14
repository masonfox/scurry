import { describe, it, expect, jest } from '@jest/globals';
import { POST } from '../app/api/add/route.js';

jest.mock('../src/lib/config', () => ({
  config: { qbUrl: 'http://qb', qbUser: 'user', qbPass: 'pass', qbCategory: 'cat' }
}));
jest.mock('../src/lib/qbittorrent', () => ({
  qbLogin: jest.fn(async () => 'cookie'),
  qbAddUrl: jest.fn(async () => true)
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
    const req = { json: async () => ({ downloadUrl: 'magnet:?xt=...' }) };
    const res = await POST(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('returns 500 if qbittorrent throws', async () => {
    const { qbAddUrl } = require('../src/lib/qbittorrent');
    qbAddUrl.mockImplementationOnce(() => { throw new Error('fail'); });
    const req = { json: async () => ({ downloadUrl: 'magnet:?xt=...' }) };
    const res = await POST(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/fail/);
  });
});

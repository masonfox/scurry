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

  it('returns 500 with fallback message if error has no message', async () => {
    qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw 'string error'; });
    
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Add failed');
  });

  it('does not bust cache if download fails', async () => {
    qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw new Error('fail'); });
    
    const req = { json: async () => ({ title: 'test', downloadUrl: 'magnet:?xt=...', category: 'cat' }) };
    await POST(req);
    
    expect(userStatsRoute.bustStatsCache).not.toHaveBeenCalled();
  });

  describe('FL via ?fl URL parameter', () => {
    const BASE_URL = 'https://www.myanonamouse.net/tor/download.php/abc123token';

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('appends ?fl to the download URL when useWedge is true', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: BASE_URL,
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.wedgeUsed).toBe(true);
      const [, , urlPassed] = qbittorrent.qbAddUrl.mock.calls[0];
      expect(urlPassed).toBe(`${BASE_URL}?fl`);
    });

    it('does NOT append ?fl when useWedge is false', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: BASE_URL,
          useWedge: false
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.wedgeUsed).toBe(false);
      const [, , urlPassed] = qbittorrent.qbAddUrl.mock.calls[0];
      expect(urlPassed).toBe(BASE_URL);
    });

    it('does NOT append ?fl when useWedge is omitted', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: BASE_URL
        })
      };

      await POST(req);

      const [, , urlPassed] = qbittorrent.qbAddUrl.mock.calls[0];
      expect(urlPassed).toBe(BASE_URL);
    });

    it('busts cache after successful FL download', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: BASE_URL,
          useWedge: true
        })
      };

      await POST(req);

      expect(userStatsRoute.bustStatsCache).toHaveBeenCalledTimes(1);
    });

    it('does not bust cache when FL download fails', async () => {
      qbittorrent.qbAddUrl.mockImplementationOnce(() => { throw new Error('qb error'); });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: BASE_URL,
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(false);
      expect(userStatsRoute.bustStatsCache).not.toHaveBeenCalled();
    });

    it('passes correct category with FL URL for audiobooks', async () => {
      const req = {
        json: async () => ({
          title: 'Test Audiobook',
          downloadUrl: BASE_URL,
          category: 'audiobooks',
          useWedge: true
        })
      };

      await POST(req);

      const [, , urlPassed, categoryPassed] = qbittorrent.qbAddUrl.mock.calls[0];
      expect(urlPassed).toBe(`${BASE_URL}?fl`);
      expect(categoryPassed).toBe('audiobooks');
    });
  });
});

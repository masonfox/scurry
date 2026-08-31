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
vi.mock('../src/lib/settings', () => ({
  readSettings: vi.fn(() => ({
    qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
    tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
    categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
  }))
}));

import * as settingsMod from '../src/lib/settings';

describe('add route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default settings (categories and tags disabled)
    settingsMod.readSettings.mockReturnValue({
      qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
      tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
      categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
    });
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

  describe('tags and categories', () => {
    it('passes tags when tags are enabled in settings', async () => {
      settingsMod.readSettings.mockReturnValue({
        qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
        tags: { enabled: true, available: ['fiction', 'favorites'], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          tags: ['fiction', 'favorites']
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://qb', 'cookie', 'magnet:?xt=...',
        expect.objectContaining({ tags: ['fiction', 'favorites'] })
      );
    });

    it('does not pass tags when tags are disabled in settings', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          tags: ['fiction']
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://qb', 'cookie', 'magnet:?xt=...',
        expect.objectContaining({ tags: undefined })
      );
    });

    it('passes category when categories are enabled', async () => {
      settingsMod.readSettings.mockReturnValue({
        qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: true, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          category: 'books'
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://qb', 'cookie', 'magnet:?xt=...',
        expect.objectContaining({ category: 'books' })
      );
    });

    it('omits category when categories are disabled', async () => {
      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          category: 'books'
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(qbittorrent.qbAddUrl).toHaveBeenCalledWith(
        'http://qb', 'cookie', 'magnet:?xt=...',
        expect.objectContaining({ category: undefined })
      );
    });
  });

  describe('FL via &fl URL parameter', () => {
    const BASE_URL = 'https://www.myanonamouse.net/tor/download.php/abc123token';
    beforeEach(() => {
      vi.clearAllMocks();
      settingsMod.readSettings.mockReturnValue({
        qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });
    });

    it('appends &fl to the download URL when useWedge is true', async () => {
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
      expect(urlPassed).toBe(`${BASE_URL}&fl`);
    });

    it('does NOT append &fl when useWedge is false', async () => {
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

    it('does NOT append &fl when useWedge is omitted', async () => {
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
      settingsMod.readSettings.mockReturnValue({
        qbittorrent: { url: 'http://qb', username: 'user', password: 'pass' },
        tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
        categories: { enabled: true, defaults: { books: 'books', audiobooks: 'audiobooks' } }
      });
      const req = {
        json: async () => ({
          title: 'Test Audiobook',
          downloadUrl: BASE_URL,
          category: 'audiobooks',
          useWedge: true
        })
      };

      await POST(req);

      const [, , urlPassed, optionsPassed] = qbittorrent.qbAddUrl.mock.calls[0];
      expect(urlPassed).toBe(`${BASE_URL}&fl`);
      expect(optionsPassed?.category).toBe('audiobooks');
    });
  });
});

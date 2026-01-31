import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/add/route.js';
import * as qbittorrent from '../src/lib/qbittorrent';
import * as userStatsRoute from '../app/api/user-stats/route.js';
import * as wedge from '../src/lib/wedge';

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
vi.mock('../src/lib/wedge', () => ({
  purchaseFlWedge: vi.fn()
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

  describe('wedge integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('purchases FL wedge before adding torrent when useWedge is true', async () => {
      // Mock successful wedge purchase
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: true,
        torrentId: '12345'
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.wedgeUsed).toBe(true);
      expect(wedge.purchaseFlWedge).toHaveBeenCalledWith('12345');
      // Verify qBittorrent was called after wedge purchase
      expect(qbittorrent.qbAddUrl).toHaveBeenCalled();
    });

    it('returns error when wedge purchase fails', async () => {
      // Mock failed wedge purchase
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: false,
        error: 'Not enough wedges',
        statusCode: 400
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(false);
      expect(json.wedgeFailed).toBe(true);
      expect(json.error).toContain('Not enough wedges');
      // Should NOT attempt to add torrent to qBittorrent
      expect(qbittorrent.qbAddUrl).not.toHaveBeenCalled();
    });

    it('does not bust cache when wedge purchase fails', async () => {
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        statusCode: 400
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      await POST(req);
      expect(userStatsRoute.bustStatsCache).not.toHaveBeenCalled();
    });

    it('returns error when wedge response has success=false', async () => {
      // Mock wedge purchase with success: false
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient bonus points',
        statusCode: 400
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(false);
      expect(json.wedgeFailed).toBe(true);
      expect(json.error).toBe('Insufficient bonus points');
      expect(qbittorrent.qbAddUrl).not.toHaveBeenCalled();
    });

    it('busts cache after successful wedge purchase and download', async () => {
      // Mock successful wedge purchase
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: true,
        torrentId: '12345'
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      await POST(req);

      expect(userStatsRoute.bustStatsCache).toHaveBeenCalledTimes(1);
    });

    it('handles wedge purchase when response has no error message', async () => {
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: false,
        statusCode: 500
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(false);
      expect(json.wedgeFailed).toBe(true);
      expect(json.error).toBe('Failed to purchase FL wedge');
    });

    it('passes tokenExpired flag from wedge service', async () => {
      wedge.purchaseFlWedge.mockResolvedValueOnce({
        success: false,
        error: 'Token expired',
        tokenExpired: true,
        statusCode: 401
      });

      const req = {
        json: async () => ({
          title: 'Test Book',
          downloadUrl: 'magnet:?xt=...',
          torrentId: '12345',
          useWedge: true
        })
      };

      const res = await POST(req);
      const json = await res.json();

      expect(json.ok).toBe(false);
      expect(json.tokenExpired).toBe(true);
    });
  });
});

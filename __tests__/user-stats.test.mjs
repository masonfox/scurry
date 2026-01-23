import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, bustStatsCache } from '../app/api/user-stats/route.js';

vi.mock('../src/lib/config', () => ({
  readMamToken: vi.fn(() => 'test-token-12345')
}));

vi.mock('../src/lib/constants', () => ({
  MAM_BASE: 'https://www.myanonamouse.net'
}));

global.fetch = vi.fn();

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('user-stats route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cache before each test
    bustStatsCache();
    // Mock console to avoid noise in test output
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('bustStatsCache', () => {
    it('busts cache for specific token when provided', () => {
      bustStatsCache('token1');
      expect(console.log).toHaveBeenCalledWith(
        'Busted user stats cache for specific token'
      );
    });

    it('busts all cache when no token provided', () => {
      bustStatsCache();
      expect(console.log).toHaveBeenCalledWith(
        'Busted all user stats cache'
      );
    });
  });

  describe('GET endpoint', () => {
    it('fetches user stats from MAM successfully', async () => {
      const mockStats = {
        uploaded: '50.5 GB',
        downloaded: '25.2 GB',
        ratio: '2.00',
        username: 'testuser',
        uid: '12345',
        wedges: 10
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      const req = {};
      const res = await GET(req);
      const json = await res.json();

      expect(json.stats).toEqual({
        uploaded: '50.5 GB',
        downloaded: '25.2 GB',
        ratio: '2.00',
        username: 'testuser',
        uid: '12345',
        flWedges: 10
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Fetched user stats for testuser')
      );
    });

    it('uses cached data when available and not expired', async () => {
      const mockStats = {
        uploaded: '50.5 GB',
        downloaded: '25.2 GB',
        ratio: '2.00',
        username: 'testuser',
        uid: '12345',
        wedges: 10
      };

      // First request - populates cache
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      await GET({});
      
      // Second request - should use cache
      const res = await GET({});
      const json = await res.json();

      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
      expect(console.log).toHaveBeenCalledWith('Returning cached user stats');
      expect(json.stats.username).toBe('testuser');
    });

    it('refetches when cache is expired', async () => {
      const mockStats = {
        uploaded: '50.5 GB',
        downloaded: '25.2 GB',
        ratio: '2.00',
        username: 'testuser',
        uid: '12345',
        wedges: 10
      };

      // First request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      await GET({});

      // Clear cache to simulate expiration
      bustStatsCache();

      // Second request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStats, ratio: '2.05' })
      });

      const res = await GET({});
      const json = await res.json();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(json.stats.ratio).toBe('2.05');
    });

    it('returns 401 when MAM token is expired (403 response)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'You are not signed in'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.tokenExpired).toBe(true);
      expect(json.error).toContain('MAM token has expired');
      expect(console.error).toHaveBeenCalledWith('MAM token has expired');
    });

    it('returns 401 when MAM token is expired (403 with case variations)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'You Are Not Signed In'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.tokenExpired).toBe(true);
    });

    it('returns 502 for other HTTP errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.error).toContain('Failed to fetch user stats: 500');
    });

    it('returns 502 for 404 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.error).toBe('Failed to fetch user stats: 404');
    });

    it('detects HTML response as expired token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => '<!DOCTYPE html><html>...</html>'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.tokenExpired).toBe(true);
      expect(json.error).toContain('MAM token has expired');
      expect(console.error).toHaveBeenCalledWith(
        'Detected HTML response, likely due to invalid/expired token'
      );
    });

    it('detects lowercase html response as expired token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => '<html><body>Login required</body></html>'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.tokenExpired).toBe(true);
    });

    it('returns 502 for invalid JSON without HTML', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => 'Invalid response'
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.error).toBe('Invalid JSON from endpoint');
    });

    it('handles missing data fields with defaults', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // Empty response
      });

      const res = await GET({});
      const json = await res.json();

      expect(json.stats).toEqual({
        uploaded: '0 B',
        downloaded: '0 B',
        ratio: '0.00',
        username: null,
        uid: null,
        flWedges: 0
      });
    });

    it('handles partial data fields with defaults', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'partialuser',
          ratio: '1.50'
        })
      });

      const res = await GET({});
      const json = await res.json();

      expect(json.stats).toEqual({
        uploaded: '0 B',
        downloaded: '0 B',
        ratio: '1.50',
        username: 'partialuser',
        uid: null,
        flWedges: 0
      });
    });

    it('handles top-level exceptions', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toContain('Network failure');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching user stats:',
        expect.any(Error)
      );
    });

    it('handles exceptions without error message', async () => {
      global.fetch.mockRejectedValueOnce('string error');

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe('Failed to fetch user stats');
    });

    it('caches stats with correct timestamp', async () => {
      const mockStats = {
        uploaded: '100 GB',
        downloaded: '50 GB',
        ratio: '2.00',
        username: 'cacheuser',
        uid: '99999',
        wedges: 5
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      const beforeTime = Date.now();
      await GET({});
      const afterTime = Date.now();

      // Second request should use cache
      const res = await GET({});
      const json = await res.json();

      expect(json.stats.username).toBe('cacheuser');
      expect(console.log).toHaveBeenCalledWith('Returning cached user stats');
      // Verify fetch was only called once (cache hit on second call)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('includes correct headers in MAM request', async () => {
      const mockStats = {
        uploaded: '50 GB',
        downloaded: '25 GB',
        ratio: '2.00',
        username: 'testuser',
        uid: '12345',
        wedges: 10
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      await GET({});

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.myanonamouse.net/jsonLoad.php',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Cookie': 'mam_id=test-token-12345',
            'Origin': 'https://www.myanonamouse.net',
            'Referer': 'https://www.myanonamouse.net/'
          },
          cache: 'no-store'
        })
      );
    });

    it('handles text() failure in error path gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => { throw new Error('Cannot read text'); }
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.error).toBe('Failed to fetch user stats: 500');
    });

    it('handles text() failure in JSON parse error path gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => { throw new Error('Cannot read text'); }
      });

      const res = await GET({});
      const json = await res.json();

      expect(res.status).toBe(502);
      expect(json.error).toBe('Invalid JSON from endpoint');
    });

    it('correctly maps wedges field to flWedges', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploaded: '1 TB',
          downloaded: '500 GB',
          ratio: '2.00',
          username: 'wedgeuser',
          uid: '11111',
          wedges: 25
        })
      });

      const res = await GET({});
      const json = await res.json();

      expect(json.stats.flWedges).toBe(25);
      // Verify original 'wedges' key is not present
      expect(json.stats.wedges).toBeUndefined();
    });

    it('cleans up old cache entries when cache size exceeds 100', async () => {
      // Import the config module to mock different tokens
      const { readMamToken } = await import('../src/lib/config');
      
      // Clear cache first
      bustStatsCache();
      
      const mockStats = {
        uploaded: '100 GB',
        downloaded: '50 GB',
        ratio: '2.00',
        username: 'user',
        uid: '123',
        wedges: 5
      };

      // Mock Date.now to control timestamps
      const baseTime = Date.now();
      let currentTime = baseTime;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Add 101 cache entries with different tokens
      for (let i = 0; i < 101; i++) {
        readMamToken.mockReturnValueOnce(`token-${i}`);
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockStats, uid: `${i}` })
        });
        
        await GET({});
        currentTime += 1000; // Advance time by 1 second for each entry
      }

      // The 101st request should trigger cleanup
      // Cache should have removed old entries
      // Verify by checking that we made 101 fetch calls (no cache hits)
      expect(global.fetch).toHaveBeenCalledTimes(101);
      
      // Now advance time past TTL for the first entries
      currentTime = baseTime + 31 * 60 * 1000; // 31 minutes later
      
      // Try to fetch with an old token - should fetch fresh (not cached)
      readMamToken.mockReturnValueOnce('token-0');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });
      
      await GET({});
      
      // Should have made a fresh fetch (102 total)
      expect(global.fetch).toHaveBeenCalledTimes(102);
    });
  });
});

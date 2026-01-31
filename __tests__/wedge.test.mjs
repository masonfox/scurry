import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseFlWedge } from '../src/lib/wedge.js';

// Mock dependencies
vi.mock('../src/lib/config', () => ({
  readMamToken: vi.fn(() => 'mock-token-123')
}));

vi.mock('../src/lib/constants', () => ({
  MAM_BASE: 'https://www.myanonamouse.net'
}));

vi.mock('../src/lib/utilities', () => ({
  generateTimestamp: vi.fn(() => 1234567890)
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('wedge service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if no torrentId provided', async () => {
    const result = await purchaseFlWedge();
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Torrent ID is required/);
    expect(result.statusCode).toBe(400);
  });

  it('returns error if torrentId is null', async () => {
    const result = await purchaseFlWedge(null);
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Torrent ID is required/);
    expect(result.statusCode).toBe(400);
  });

  it('returns error if torrentId is empty string', async () => {
    const result = await purchaseFlWedge('');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Torrent ID is required/);
    expect(result.statusCode).toBe(400);
  });

  it('successfully purchases FL wedge with valid torrentId', async () => {
    // Mock successful MAM API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(true);
    expect(result.torrentId).toBe('12345');
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('bonusBuy.php'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Cookie': 'mam_id=mock-token-123'
        })
      })
    );
    
    // Verify URL contains torrentid parameter
    const fetchCall = global.fetch.mock.calls[0][0];
    expect(fetchCall).toContain('torrentid=12345');
    expect(fetchCall).toContain('spendtype=personalFL');
  });

  it('returns 502 if MAM API returns non-ok response', async () => {
    // Mock failed MAM API response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Failed to purchase FL wedge/);
    expect(result.statusCode).toBe(502);
  });

  it('returns 401 if MAM token is expired', async () => {
    // Mock token expiration response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'You are not signed in'
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/MAM token has expired/);
    expect(result.tokenExpired).toBe(true);
    expect(result.statusCode).toBe(401);
  });

  it('returns 400 if MAM API returns success: false', async () => {
    // Mock MAM API returning success: false
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Insufficient bonus points' })
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Insufficient bonus points/);
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 if MAM API returns success: false without error message', async () => {
    // Mock MAM API returning success: false with no error field
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false })
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to use FL wedge: Unknown error occurred');
    expect(result.statusCode).toBe(400);
  });

  it('returns 400 if MAM API returns an error field', async () => {
    // Mock MAM API returning error
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Torrent not found' })
    });

    const result = await purchaseFlWedge('99999');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Torrent not found/);
    expect(result.statusCode).toBe(400);
  });

  it('returns 502 if MAM API returns invalid JSON', async () => {
    // Mock invalid JSON response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => '<html>Invalid response</html>'
    });

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid response from MAM API/);
    expect(result.statusCode).toBe(502);
  });

  it('returns 500 if unexpected error occurs', async () => {
    // Mock fetch throwing an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await purchaseFlWedge('12345');
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Network error|Failed to use FL wedge/);
    expect(result.statusCode).toBe(500);
  });

  it('works with numeric torrentId', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await purchaseFlWedge(67890);
    
    expect(result.success).toBe(true);
    expect(result.torrentId).toBe('67890');
  });

  it('converts numeric torrentId to string in response', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await purchaseFlWedge(12345);
    
    expect(result.success).toBe(true);
    expect(result.torrentId).toBe('12345');
    expect(typeof result.torrentId).toBe('string');
  });
});

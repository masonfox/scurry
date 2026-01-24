import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/use-wedge/route.js';

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

describe('use-wedge route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if no torrentId provided', async () => {
    const req = { json: async () => ({}) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Torrent ID is required/);
  });

  it('returns 400 if torrentId is null', async () => {
    const req = { json: async () => ({ torrentId: null }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Torrent ID is required/);
  });

  it('returns 400 if torrentId is empty string', async () => {
    const req = { json: async () => ({ torrentId: '' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Torrent ID is required/);
  });

  it('successfully purchases FL wedge with valid torrentId', async () => {
    // Mock successful MAM API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/FL wedge applied successfully/);
    expect(json.torrentId).toBe('12345');
    
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

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(502);
    expect(json.error).toMatch(/Failed to purchase FL wedge/);
  });

  it('returns 401 if MAM token is expired', async () => {
    // Mock token expiration response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'You are not signed in'
    });

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/MAM token has expired/);
    expect(json.tokenExpired).toBe(true);
  });

  it('returns 400 if MAM API returns success: false', async () => {
    // Mock MAM API returning success: false
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Insufficient bonus points' })
    });

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Insufficient bonus points/);
  });

  it('returns 400 if MAM API returns success: false without error message', async () => {
    // Mock MAM API returning success: false with no error field
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false })
    });

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toBe('Failed to use FL wedge: Unknown error occurred');
  });

  it('returns 400 if MAM API returns an error field', async () => {
    // Mock MAM API returning error
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Torrent not found' })
    });

    const req = { json: async () => ({ torrentId: '99999' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Torrent not found/);
  });

  it('returns 502 if MAM API returns invalid JSON', async () => {
    // Mock invalid JSON response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
      text: async () => '<html>Invalid response</html>'
    });

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(502);
    expect(json.error).toMatch(/Invalid response from MAM API/);
  });

  it('returns 500 if unexpected error occurs', async () => {
    // Mock fetch throwing an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const req = { json: async () => ({ torrentId: '12345' }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(500);
    expect(json.error).toMatch(/Network error|Failed to use FL wedge/);
  });

  it('works with numeric torrentId', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const req = { json: async () => ({ torrentId: 67890 }) };
    const res = await POST(req);
    const json = await res.json();
    
    expect(json.success).toBe(true);
    expect(json.torrentId).toBe(67890);
  });
});

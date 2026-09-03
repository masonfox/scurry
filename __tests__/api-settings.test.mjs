import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '../app/api/settings/route.js';

// Must be hoisted before the route is imported
vi.mock('../src/lib/settings', () => ({
  readSettingsSafe: vi.fn(),
  writeSettings: vi.fn(),
}));

import * as settingsMod from '../src/lib/settings';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const SAMPLE_SAFE_SETTINGS = {
  qbittorrent: { url: 'http://localhost:8080', username: 'admin', password: '••••••••' },
  tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
  categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } },
};

// ---------------------------------------------------------------------------
// GET /api/settings
// ---------------------------------------------------------------------------
describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMod.readSettingsSafe.mockReturnValue(SAMPLE_SAFE_SETTINGS);
  });

  it('returns ok:true with masked settings on success', async () => {
    const res = await GET();
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.settings).toEqual(SAMPLE_SAFE_SETTINGS);
    // Password should be the mask, not a real value
    expect(json.settings.qbittorrent.password).toBe('••••••••');
  });

  it('calls readSettingsSafe exactly once', async () => {
    await GET();
    expect(settingsMod.readSettingsSafe).toHaveBeenCalledTimes(1);
  });

  it('returns 500 with error message when readSettingsSafe throws', async () => {
    settingsMod.readSettingsSafe.mockImplementationOnce(() => {
      throw new Error('Disk read error');
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Disk read error');
  });

  it('returns 500 with fallback message when error has no message', async () => {
    settingsMod.readSettingsSafe.mockImplementationOnce(() => {
      // eslint-disable-next-line no-throw-literal
      throw {};
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Failed to read settings');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/settings
// ---------------------------------------------------------------------------
describe('PUT /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // writeSettings succeeds by default
    settingsMod.writeSettings.mockReturnValue(undefined);
    // readSettingsSafe is called after write to produce the response body
    settingsMod.readSettingsSafe.mockReturnValue(SAMPLE_SAFE_SETTINGS);
  });

  it('saves settings and returns the masked settings on success', async () => {
    const req = { json: async () => ({ settings: SAMPLE_SAFE_SETTINGS }) };

    const res = await PUT(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(settingsMod.writeSettings).toHaveBeenCalledWith(SAMPLE_SAFE_SETTINGS);
    expect(settingsMod.readSettingsSafe).toHaveBeenCalledTimes(1);
    expect(json.settings).toEqual(SAMPLE_SAFE_SETTINGS);
  });

  it('returns 400 when settings key is absent from the request body', async () => {
    const req = { json: async () => ({}) };

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('No settings provided');
    expect(settingsMod.writeSettings).not.toHaveBeenCalled();
  });

  it('returns 400 when settings value is null', async () => {
    const req = { json: async () => ({ settings: null }) };

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('No settings provided');
  });

  it('returns 400 when writeSettings throws an "Invalid settings" error', async () => {
    settingsMod.writeSettings.mockImplementationOnce(() => {
      throw new Error('Invalid settings: qBittorrent URL is required');
    });

    const req = { json: async () => ({ settings: SAMPLE_SAFE_SETTINGS }) };

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/Invalid settings/);
  });

  it('returns 500 when writeSettings throws a non-validation error', async () => {
    settingsMod.writeSettings.mockImplementationOnce(() => {
      throw new Error('ENOSPC: no space left on device');
    });

    const req = { json: async () => ({ settings: SAMPLE_SAFE_SETTINGS }) };

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('ENOSPC: no space left on device');
  });

  it('returns 500 with fallback message when error has no message', async () => {
    settingsMod.writeSettings.mockImplementationOnce(() => {
      // eslint-disable-next-line no-throw-literal
      throw {};
    });

    const req = { json: async () => ({ settings: SAMPLE_SAFE_SETTINGS }) };

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Failed to save settings');
  });

  it('does not call readSettingsSafe when settings body is missing', async () => {
    const req = { json: async () => ({}) };
    await PUT(req);
    expect(settingsMod.readSettingsSafe).not.toHaveBeenCalled();
  });
});

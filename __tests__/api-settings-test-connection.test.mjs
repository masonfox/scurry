import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/settings/test-connection/route.js';
import { PASSWORD_MASK } from '../src/lib/constants.js';

// Must be hoisted before the route is imported
vi.mock('../src/lib/settings', () => ({
  readSettings: vi.fn(),
}));

vi.mock('../src/lib/qbittorrent', () => ({
  qbLogin: vi.fn(),
}));

import * as settingsMod from '../src/lib/settings';
import * as qb from '../src/lib/qbittorrent';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const QB_URL = 'http://localhost:8080';
const QB_USER = 'admin';
const QB_PASS = 'realpassword123';
const QB_COOKIE = 'SID=test-cookie-abc';

const SAVED_SETTINGS = {
  qbittorrent: { url: QB_URL, username: QB_USER, password: QB_PASS },
  tags: { enabled: false, available: [], defaults: { books: [], audiobooks: [] } },
  categories: { enabled: false, defaults: { books: 'books', audiobooks: 'audiobooks' } },
};

function makeReq(body) {
  return { json: async () => body };
}

// ---------------------------------------------------------------------------
// POST /api/settings/test-connection
// ---------------------------------------------------------------------------
describe('POST /api/settings/test-connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMod.readSettings.mockReturnValue(SAVED_SETTINGS);
    qb.qbLogin.mockResolvedValue(QB_COOKIE);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  it('returns ok:true with success message when login succeeds', async () => {
    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.message).toBe('Connection successful');
  });

  it('passes trimmed url and username to qbLogin', async () => {
    await POST(makeReq({ url: `  ${QB_URL}  `, username: `  ${QB_USER}  `, password: QB_PASS }));

    expect(qb.qbLogin).toHaveBeenCalledWith(QB_URL, QB_USER, QB_PASS);
  });

  // -------------------------------------------------------------------------
  // Password unmasking
  // -------------------------------------------------------------------------
  it('reads saved password when request password equals PASSWORD_MASK', async () => {
    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: PASSWORD_MASK }));
    const json = await res.json();

    expect(settingsMod.readSettings).toHaveBeenCalledTimes(1);
    expect(qb.qbLogin).toHaveBeenCalledWith(QB_URL, QB_USER, QB_PASS);
    expect(json.ok).toBe(true);
  });

  it('does not call readSettings when a real password is provided', async () => {
    await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    expect(settingsMod.readSettings).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — missing / blank fields
  // -------------------------------------------------------------------------
  it('returns 400 when url is missing', async () => {
    const res = await POST(makeReq({ username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('URL, username, and password are required');
  });

  it('returns 400 when url is blank whitespace', async () => {
    const res = await POST(makeReq({ url: '   ', username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('URL, username, and password are required');
  });

  it('returns 400 when username is missing', async () => {
    const res = await POST(makeReq({ url: QB_URL, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it('returns 400 when username is blank whitespace', async () => {
    const res = await POST(makeReq({ url: QB_URL, username: '  ', password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeReq({ url: QB_URL, username: QB_USER }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it('returns 400 when entire body is empty', async () => {
    const res = await POST(makeReq({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Connection failure — qbLogin returns falsy
  // -------------------------------------------------------------------------
  it('returns 500 with "Connection failed" when qbLogin returns null', async () => {
    qb.qbLogin.mockResolvedValue(null);

    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Connection failed - no session received');
  });

  it('returns 500 with "Connection failed" when qbLogin returns empty string', async () => {
    qb.qbLogin.mockResolvedValue('');

    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Connection failed - no session received');
  });

  // -------------------------------------------------------------------------
  // Connection failure — qbLogin throws
  // -------------------------------------------------------------------------
  it('returns 500 with error message when qbLogin throws', async () => {
    qb.qbLogin.mockRejectedValue(new Error('Connection refused'));

    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Connection refused');
  });

  it('returns 500 with fallback message when thrown error has no message', async () => {
    qb.qbLogin.mockRejectedValue({});

    const res = await POST(makeReq({ url: QB_URL, username: QB_USER, password: QB_PASS }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Connection test failed');
  });

  it('does not call qbLogin when required fields are missing', async () => {
    await POST(makeReq({ url: QB_URL }));
    expect(qb.qbLogin).not.toHaveBeenCalled();
  });
});

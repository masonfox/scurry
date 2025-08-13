
import { POST as loginPOST } from '../app/api/login/route.js';
import { POST as logoutPOST } from '../app/api/logout/route.js';
import { config } from '../src/lib/config.js';
import { SESSION_COOKIE } from '../src/lib/constants.js';

describe('Auth API', () => {
  describe('login', () => {
    test('POST returns error if no password', async () => {
      const req = { json: async () => ({}) };
      const res = await loginPOST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/Password required/);
    });

    test('POST returns error if password is wrong', async () => {
      const req = { json: async () => ({ password: 'wrong' }) };
      const res = await loginPOST(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toMatch(/Invalid password/);
    });

    test('POST returns success if password is correct', async () => {
      const req = { json: async () => ({ password: config.appPassword }) };
      const res = await loginPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('logout', () => {
    test('POST clears the session cookie and returns success', async () => {
      const res = await logoutPOST();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Check that the cookie is set to expire
      const setCookie = res.cookies.get(SESSION_COOKIE);
      expect(setCookie).toBeDefined();
      expect(setCookie.value).toBe('');
      expect(setCookie.maxAge).toBe(0);
    });
  });
});

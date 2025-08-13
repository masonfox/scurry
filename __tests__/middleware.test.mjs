import { middleware } from '../middleware.js';
import { SESSION_COOKIE, ALLOWED_PATHS } from '../src/lib/constants.js';
import { NextResponse } from 'next/server';

describe('middleware', () => {
  function mockRequest(pathname, cookieValue) {
    // Use a real URL object for nextUrl
    const url = new URL('http://localhost' + pathname);
    return {
      nextUrl: Object.assign(url, {
        clone() {
          // Return a new URL object with the same href
          return new URL(this.href);
        },
      }),
      cookies: {
        get: (name) =>
          name === SESSION_COOKIE && cookieValue !== undefined
            ? { value: cookieValue }
            : undefined,
      },
    };
  }

  test('allows API and static routes', () => {
    ALLOWED_PATHS.forEach((base) => {
      // For static files, use the path as is; for routes, append a subpath
      const path = base.startsWith('/') && base.length > 1 && !base.includes('.') ? base + '/foo' : base;
      const req = mockRequest(path);
      const res = middleware(req);
      expect(res).toEqual(NextResponse.next());
    });
  });

  test('allows /login', () => {
    const req = mockRequest('/login');
    const res = middleware(req);
    expect(res).toEqual(NextResponse.next());
  });

  test('redirects to /login if no session cookie', () => {
    const req = mockRequest('/protected');
    const res = middleware(req);
  expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  test('allows if session cookie is present', () => {
    const req = mockRequest('/protected', '1');
    const res = middleware(req);
    expect(res).toEqual(NextResponse.next());
  });
});

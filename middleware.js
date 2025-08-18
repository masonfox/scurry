// Middleware to check for session cookie and redirect to /login if not present
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ALLOWED_PATHS } from './src/lib/constants.js';


export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  // Allow API routes and static files
  if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // Allow login page
  if (pathname === '/login') {
    return NextResponse.next();
  }
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Clear existing search params first
    url.search = '';
    // Preserve query string by adding original URL as a redirect parameter
    if (pathname !== '/' || search) {
      const originalUrl = pathname + search;
      url.searchParams.set('redirect', originalUrl);
    }
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|apple-icon.png|logo.png).*)'],
};

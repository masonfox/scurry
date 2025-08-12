// Middleware to check for session cookie and redirect to /login if not present
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'scurry_session';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  // Allow API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/apple-icon.png') || pathname.startsWith('/logo.png')) {
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
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|apple-icon.png|logo.png).*)'],
};

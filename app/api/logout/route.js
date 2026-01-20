// API route for logout: clears the session cookie
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/src/lib/constants.js';
import { isSecureConnection } from '@/src/lib/auth.js';


export async function POST(req) {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureConnection(req),
    path: '/',
    maxAge: 0, // Expire immediately
  });
  return res;
}

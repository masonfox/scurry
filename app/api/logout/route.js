// API route for logout: clears the session cookie
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'scurry_session';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 0, // Expire immediately
  });
  return res;
}

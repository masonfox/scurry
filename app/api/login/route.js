// API route for login: checks password and sets session cookie
import { NextResponse } from 'next/server';
import { config } from '@/src/lib/config';
import { SESSION_COOKIE } from '@/src/lib/constants.js';

const SESSION_SECRET = config.appPassword;

export async function POST(req) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: 'Password required.' }, { status: 400 });
  }
  if (password !== SESSION_SECRET) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }
  // Set a simple session cookie (value can be anything, e.g. '1')
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

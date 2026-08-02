import { NextResponse } from 'next/server';
import { AUTH_COOKIE, signSession } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 90 * 24 * 60 * 60 * 1000; // ~90 days

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req) {
  const passcode = process.env.APP_PASSCODE;
  const secret = process.env.SESSION_SECRET;

  // If the gate isn't configured there's nothing to unlock.
  if (!passcode || !secret) {
    return NextResponse.json({ ok: true, gate: 'off' });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const attempt = typeof body?.passcode === 'string' ? body.passcode : '';

  if (!safeEqual(attempt, passcode)) {
    return NextResponse.json({ ok: false, error: 'wrong' }, { status: 401 });
  }

  const token = await signSession(secret, TTL_MS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(TTL_MS / 1000),
  });
  return res;
}

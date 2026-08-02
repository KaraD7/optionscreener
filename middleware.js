import { NextResponse } from 'next/server';
import { AUTH_COOKIE, verifySession } from './lib/auth';

// App-level passcode gate. Runs on the Edge for every request that isn't
// static or the unlock flow itself.
//
// The gate is ACTIVE only when APP_PASSCODE is set. With no passcode
// configured it lets everything through — so the app still runs locally and
// you can never lock yourself out with no way back in. Set APP_PASSCODE (and
// SESSION_SECRET) in the Vercel dashboard to switch protection on.

export const config = {
  // Everything except Next internals, the unlock page/route, and common
  // static files. Those must stay reachable so a locked-out user can sign in.
  matcher: ['/((?!_next/static|_next/image|unlock|api/unlock|favicon.ico|robots.txt).*)'],
};

export async function middleware(req) {
  const passcode = process.env.APP_PASSCODE;
  const secret = process.env.SESSION_SECRET;

  // Gate off (no passcode configured) → behave exactly like before.
  if (!passcode || !secret) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await verifySession(token, secret)) return NextResponse.next();

  // API calls get a clean 401 rather than an HTML redirect.
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'locked' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/unlock';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

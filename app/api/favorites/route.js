import { NextResponse } from 'next/server';
import { dbConfigured, getFavorites, saveFavorites } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Shape guard: only ever persist the two lists we own, never arbitrary blobs.
function sanitize(body) {
  const tickers = Array.isArray(body?.tickers)
    ? body.tickers.filter((x) => typeof x === 'string').slice(0, 500)
    : [];
  const options = Array.isArray(body?.options)
    ? body.options.filter((x) => x && typeof x === 'object').slice(0, 500)
    : [];
  return { tickers, options };
}

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json({ configured: false, data: null });
  }
  try {
    const data = await getFavorites();
    return NextResponse.json({ configured: true, data });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: err.message || 'Failed to load favorites.' },
      { status: 502 }
    );
  }
}

export async function PUT(req) {
  if (!dbConfigured()) {
    return NextResponse.json({ configured: false });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  try {
    const clean = sanitize(body);
    await saveFavorites(clean);
    return NextResponse.json({ configured: true, ok: true });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: err.message || 'Failed to save favorites.' },
      { status: 502 }
    );
  }
}

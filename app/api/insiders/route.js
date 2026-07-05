import { NextResponse } from 'next/server';
import { getInsiderActivity } from '../../../lib/edgar';
import { scoreCluster } from '../../../lib/insiders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_DAYS = 180;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || '').trim().toUpperCase();
  const daysRaw = parseInt(searchParams.get('days'), 10);
  const windowRaw = parseInt(searchParams.get('window'), 10);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 7), MAX_DAYS) : 90;
  const windowDays = Number.isFinite(windowRaw)
    ? Math.min(Math.max(windowRaw, 7), days)
    : 30;

  if (!ticker) {
    return NextResponse.json({ error: 'Enter a ticker symbol.' }, { status: 400 });
  }

  try {
    const { cik, name, transactions } = await getInsiderActivity(ticker, days);
    const cluster = scoreCluster(transactions, { windowDays });
    return NextResponse.json({
      ticker,
      name,
      cik,
      asOf: new Date().toISOString(),
      days,
      cluster,
      transactions,
    });
  } catch (err) {
    const notFound = /not found/i.test(err.message || '');
    return NextResponse.json(
      { error: err.message || 'Failed to load insider data.' },
      { status: notFound ? 404 : 502 }
    );
  }
}

import { NextResponse } from 'next/server';
import { greeks } from '../../../lib/blackscholes';
import { hv, hvRange } from '../../../lib/volatility';
import {
  getOptionMeta,
  getDailyCloses,
  getChainForDate,
} from '../../../lib/yahoo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const YEAR = 365 * 24 * 60 * 60; // seconds
const MAX_EXPIRATIONS = 30;
const STRIKE_WINDOW = 10; // each side of spot
const MIN_OI = 10;
const MIN_VOL = 10;
const MIN_IV = 0.02; // below this, Yahoo's IV solve is unreliable (near-zero time value)
const MIN_DTE_FOR_RANK = 2; // 0-1 DTE contracts have near-zero extrinsic value; skip entirely
const MIN_BEST_DELTA = 0.05; // "best" picks must have meaningful payoff sensitivity

// When Yahoo's IV solver can't organically price a contract (thinly/never traded strike,
// stale last price vs. current spot, whatever the reason), it silently falls back to one of
// a small fixed template of values instead of a real per-contract solve. Observed across
// unrelated tickers/strikes/expiries, those values sit within ~2% of an exact power of two
// times 1/128 (0.0078125, 0.015625, 0.03125, 0.0625, 0.125, 0.25, 0.5, ...) — a coincidence
// no genuine solve would land on. Detect and skip those instead of trusting them.
function isSyntheticIv(iv) {
  const ratio = iv / 0.0078125;
  const nearestPow2 = Math.pow(2, Math.round(Math.log2(ratio)));
  return Math.abs(ratio - nearestPow2) / nearestPow2 < 0.02;
}

// Resolve concurrency-limited fetches so we don't hammer Yahoo or time out.
async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

function nearestIndex(sortedStrikes, spot) {
  let best = 0;
  let bestDiff = Infinity;
  sortedStrikes.forEach((k, i) => {
    const d = Math.abs(k - spot);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  });
  return best;
}

function liquid(c) {
  return (c.openInterest || 0) >= MIN_OI || (c.volume || 0) >= MIN_VOL;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || '').trim().toUpperCase();
  const rate = parseFloat(searchParams.get('rate'));
  const commission = parseFloat(searchParams.get('commission'));
  const r = Number.isFinite(rate) ? rate / 100 : 0.043;
  const comm = Number.isFinite(commission) ? commission : 0.65;

  if (!ticker) {
    return NextResponse.json({ error: 'Enter a ticker symbol.' }, { status: 400 });
  }

  try {
    const [meta, closes] = await Promise.all([
      getOptionMeta(ticker),
      getDailyCloses(ticker).catch(() => []),
    ]);

    const spot = meta.spot;
    if (!(spot > 0)) {
      return NextResponse.json(
        { error: `No live price for ${ticker}. Market may be closed or the symbol is wrong.` },
        { status: 404 }
      );
    }

    const hv20 = hv(closes, 20);
    const hv30 = hv(closes, 30);
    const hvBand = hvRange(closes, 30);
    const hvBase = hv30 || hv20 || hvBand?.current || null;

    // Pick which expirations to load (all available, capped for safety).
    const expirations = (meta.expirations || []).slice(0, MAX_EXPIRATIONS);

    const chains = await inBatches(expirations, 6, async (epoch) => {
      // reuse the chain already returned by the meta call for expiration[0]
      if (meta.firstChain && meta.firstChain.expirationDate === epoch) {
        return meta.firstChain;
      }
      try {
        return await getChainForDate(ticker, epoch);
      } catch {
        return { expirationDate: epoch, calls: [], puts: [] };
      }
    });

    const now = Math.floor(Date.now() / 1000);
    const rows = [];

    for (const chain of chains) {
      const exp = chain.expirationDate;
      const T = Math.max((exp - now) / YEAR, 0);
      const dte = Math.round((exp - now) / 86400);
      if (dte < MIN_DTE_FOR_RANK) continue;

      for (const side of ['call', 'put']) {
        const list = side === 'call' ? chain.calls : chain.puts;
        if (!Array.isArray(list) || list.length === 0) continue;

        const strikes = [...new Set(list.map((c) => c.strike))].sort((a, b) => a - b);
        const idx = nearestIndex(strikes, spot);
        const lo = strikes[Math.max(0, idx - STRIKE_WINDOW)];
        const hi = strikes[Math.min(strikes.length - 1, idx + STRIKE_WINDOW)];

        for (const c of list) {
          if (c.strike < lo || c.strike > hi) continue;
          if (!liquid(c)) continue;
          const iv = c.impliedVolatility;
          if (!(iv > MIN_IV) || isSyntheticIv(iv)) continue;
          const ivHv = hvBase ? iv / hvBase : null;

          const g = greeks({ S: spot, K: c.strike, T, r, sigma: iv, type: side });
          const premium =
            c.ask > 0 ? c.ask : c.lastPrice > 0 ? c.lastPrice : c.bid || 0;
          const costPerShare = premium + comm / 100;
          const breakeven =
            side === 'call' ? c.strike + costPerShare : c.strike - costPerShare;

          rows.push({
            type: side,
            strike: c.strike,
            expiration: exp,
            dte,
            iv,
            ivHv,
            delta: g.delta,
            gamma: g.gamma,
            theta: g.theta,
            vega: g.vega,
            bid: c.bid ?? null,
            ask: c.ask ?? null,
            last: c.lastPrice ?? null,
            premium,
            breakeven,
            volume: c.volume ?? 0,
            openInterest: c.openInterest ?? 0,
            inTheMoney: !!c.inTheMoney,
            contractSymbol: c.contractSymbol,
          });
        }
      }
    }

    // Cheapest vol = lowest IV/HV, separately for calls and puts. Also require a
    // non-trivial delta: even with a genuine IV, a strike far enough out at a short
    // enough dte has near-zero payoff sensitivity and makes a useless "best" pick.
    const eligible = (t) =>
      rows
        .filter(
          (x) =>
            x.type === t &&
            x.ivHv != null &&
            x.premium > 0 &&
            Math.abs(x.delta) > MIN_BEST_DELTA
        )
        .sort((a, b) => a.ivHv - b.ivHv);
    const bestCall = eligible('call')[0] || null;
    const bestPut = eligible('put')[0] || null;

    // ATM IV (nearest strike, nearest expiry) for the headline gauge.
    let atmIv = null;
    if (rows.length) {
      const minDte = Math.min(...rows.map((x) => x.dte));
      const frontRows = rows.filter((x) => x.dte === minDte);
      const atm = frontRows.sort(
        (a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot)
      )[0];
      if (atm) atmIv = atm.iv;
    }

    return NextResponse.json({
      ticker,
      name: meta.name,
      currency: meta.currency,
      spot,
      asOf: new Date().toISOString(),
      rate: r,
      commission: comm,
      hv: {
        hv20,
        hv30,
        band52w: hvBand,
        atmIv,
      },
      bestCall,
      bestPut,
      rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to load options data.' },
      { status: 502 }
    );
  }
}

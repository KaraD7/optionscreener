// Yahoo Finance data layer. Server-side only (runs in the Vercel function).
// Yahoo is unofficial and sometimes requires a cookie + crumb and a real
// User-Agent. We handle that here and surface clear errors.
//
// If Yahoo starts blocking the Vercel datacenter IPs, this is the ONE module
// to swap for Tradier — the rest of the app consumes the shape below.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

let _cookie = null;
let _crumb = null;

async function ensureCrumb() {
  if (_cookie && _crumb) return;
  // 1) get a cookie
  const c = await fetch('https://fc.yahoo.com/', {
    headers: { 'User-Agent': UA },
  }).catch(() => null);
  if (c) {
    const set = c.headers.get('set-cookie');
    if (set) _cookie = set.split(';')[0];
  }
  // 2) get a crumb using that cookie
  const r = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': UA,
      ...(_cookie ? { Cookie: _cookie } : {}),
    },
  });
  if (r.ok) {
    const txt = (await r.text()).trim();
    if (txt && !txt.startsWith('<')) _crumb = txt;
  }
}

async function yfetch(url) {
  await ensureCrumb();
  const u = new URL(url);
  if (_crumb) u.searchParams.set('crumb', _crumb);
  const res = await fetch(u.toString(), {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      ...(_cookie ? { Cookie: _cookie } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    // stale crumb — reset once and retry
    _cookie = null;
    _crumb = null;
    await ensureCrumb();
    if (_crumb) u.searchParams.set('crumb', _crumb);
    const retry = await fetch(u.toString(), {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...(_cookie ? { Cookie: _cookie } : {}),
      },
    });
    if (!retry.ok) throw new Error(`Yahoo ${retry.status} (auth) for ${u.pathname}`);
    return retry.json();
  }
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${u.pathname}`);
  return res.json();
}

// 1 year of daily closes for HV.
export async function getDailyCloses(symbol) {
  const data = await yfetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=1y&interval=1d`
  );
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No price history returned');
  const quotes = result.indicators?.quote?.[0]?.close || [];
  return quotes.filter((v) => typeof v === 'number' && v > 0);
}

// Base options call: returns spot price + the list of expiration epochs.
export async function getOptionMeta(symbol) {
  const data = await yfetch(
    `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(
      symbol
    )}`
  );
  const result = data?.optionChain?.result?.[0];
  if (!result) {
    const desc = data?.optionChain?.error?.description;
    throw new Error(desc || 'Symbol not found or has no listed options');
  }
  const spot =
    result.quote?.regularMarketPrice ??
    result.quote?.postMarketPrice ??
    result.quote?.preMarketPrice;
  return {
    spot,
    currency: result.quote?.currency || 'USD',
    name: result.quote?.shortName || result.quote?.longName || symbol,
    expirations: result.expirationDates || [],
    firstChain: result.options?.[0] || null,
  };
}

// One expiration's calls + puts.
export async function getChainForDate(symbol, dateEpoch) {
  const data = await yfetch(
    `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(
      symbol
    )}?date=${dateEpoch}`
  );
  const opt = data?.optionChain?.result?.[0]?.options?.[0];
  return opt || { expirationDate: dateEpoch, calls: [], puts: [] };
}

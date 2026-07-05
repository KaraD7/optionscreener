// SEC EDGAR data layer (Form 4 insider filings). Server-side only.
// Official and free — no API key. SEC requires a descriptive User-Agent
// with a contact address and caps clients at ~10 req/s; we fetch filings
// in small batches to stay well under that.
//
// Isolated on purpose, same as lib/yahoo.js: the API route only consumes
// the shape returned by getInsiderActivity() below, so this module can be
// swapped for a commercial Form 4 API without touching anything else.

const UA = 'options-iv-hv-screener/1.4 (contact: kolichkatest@gmail.com)';

// Ticker -> CIK map (~1MB). Cached for the lifetime of the warm lambda.
let _tickerMap = null;

async function efetch(url, as = 'json') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: as === 'json' ? 'application/json' : 'text/plain',
    },
  });
  if (!res.ok) throw new Error(`SEC EDGAR ${res.status} for ${new URL(url).pathname}`);
  return as === 'json' ? res.json() : res.text();
}

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

export async function cikForTicker(ticker) {
  if (!_tickerMap) {
    const data = await efetch('https://www.sec.gov/files/company_tickers.json');
    _tickerMap = {};
    for (const row of Object.values(data)) {
      _tickerMap[String(row.ticker).toUpperCase()] = {
        cik: row.cik_str,
        name: row.title,
      };
    }
  }
  return _tickerMap[ticker.toUpperCase()] || null;
}

// The submissions API lists a company's filings as parallel arrays.
async function listRecentForm4(cik, sinceDate) {
  const padded = String(cik).padStart(10, '0');
  const data = await efetch(`https://data.sec.gov/submissions/CIK${padded}.json`);
  const r = data?.filings?.recent;
  const out = [];
  const n = r?.form?.length || 0;
  for (let i = 0; i < n; i++) {
    if (r.form[i] !== '4') continue;
    if (r.filingDate[i] < sinceDate) continue;
    out.push({
      accession: r.accessionNumber[i],
      filingDate: r.filingDate[i],
      primaryDocument: r.primaryDocument[i],
    });
  }
  return out;
}

// --- Minimal Form 4 ownership-XML parsing (regex; the docs are machine-
// generated and well-formed, and we only need a handful of fields — keeps
// the app at zero runtime dependencies). ---

function firstTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`));
  return m ? m[1].trim() : null;
}

// Fields like shares/price/date are wrapped in an extra <value> element.
function firstValue(xml, tag) {
  const inner = firstTag(xml, tag);
  if (inner == null) return null;
  const v = firstTag(inner, 'value');
  return v != null ? v : inner;
}

function boolTag(xml, tag) {
  const v = firstTag(xml, tag);
  return v === '1' || v === 'true';
}

export function parseForm4Xml(xml) {
  const ownerBlock = firstTag(xml, 'reportingOwner') || xml;
  const owner = {
    name: firstTag(ownerBlock, 'rptOwnerName') || 'Unknown',
    isDirector: boolTag(ownerBlock, 'isDirector'),
    isOfficer: boolTag(ownerBlock, 'isOfficer'),
    isTenPercentOwner: boolTag(ownerBlock, 'isTenPercentOwner'),
    officerTitle: firstTag(ownerBlock, 'officerTitle') || null,
  };

  const transactions = [];
  const re = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const code = firstTag(b, 'transactionCode');
    const shares = parseFloat(firstValue(b, 'transactionShares'));
    const price = parseFloat(firstValue(b, 'transactionPricePerShare'));
    const acquired = firstValue(b, 'transactionAcquiredDisposedCode');
    transactions.push({
      date: firstValue(b, 'transactionDate'),
      code, // P = open-market purchase, S = sale, A = award/grant, ...
      shares: Number.isFinite(shares) ? shares : null,
      price: Number.isFinite(price) ? price : null,
      value:
        Number.isFinite(shares) && Number.isFinite(price)
          ? shares * price
          : null,
      acquired, // A = acquired, D = disposed
    });
  }
  return { owner, transactions };
}

const MAX_FILINGS = 40; // newest first; enough for any realistic cluster window

// Main entry: all non-derivative insider transactions for a ticker filed in
// the last `days` days, flattened across filings, newest first.
export async function getInsiderActivity(ticker, days = 90) {
  const co = await cikForTicker(ticker);
  if (!co) throw new Error(`${ticker} not found in the SEC EDGAR company list`);

  const since = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const filings = (await listRecentForm4(co.cik, since)).slice(0, MAX_FILINGS);

  const parsed = await inBatches(filings, 5, async (f) => {
    try {
      // primaryDocument is sometimes prefixed with an XSL render path
      // (e.g. "xslF345X05/form4.xml") — strip it to get the raw XML.
      const doc = f.primaryDocument.replace(/^.*\//, '');
      const acc = f.accession.replace(/-/g, '');
      const xml = await efetch(
        `https://www.sec.gov/Archives/edgar/data/${Number(co.cik)}/${acc}/${doc}`,
        'text'
      );
      return { filing: f, ...parseForm4Xml(xml) };
    } catch {
      return null; // one broken filing shouldn't kill the whole answer
    }
  });

  const transactions = [];
  for (const p of parsed) {
    if (!p) continue;
    for (const tx of p.transactions) {
      transactions.push({
        ...tx,
        owner: p.owner.name,
        officerTitle: p.owner.officerTitle,
        isOfficer: p.owner.isOfficer,
        isDirector: p.owner.isDirector,
        isTenPercentOwner: p.owner.isTenPercentOwner,
        filingDate: p.filing.filingDate,
        accession: p.filing.accession,
      });
    }
  }
  transactions.sort((a, b) => (b.date || b.filingDate).localeCompare(a.date || a.filingDate));

  return { cik: co.cik, name: co.name, transactions };
}

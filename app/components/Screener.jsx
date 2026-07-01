'use client';

import { useMemo, useState } from 'react';
import { pct, fix, money, dateStr, ratioColor } from '../../lib/format';
import Info from './Info';

function Gauge({ iv, band }) {
  if (!band || band.max <= band.min) {
    return <div className="gauge"><div className="cap">No 52-week HV range available.</div></div>;
  }
  const span = band.max - band.min;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ivPos = clamp((iv - band.min) / span) * 100;
  return (
    <div className="gauge">
      <div className="track">
        <div className="pin" style={{ left: `${ivPos}%` }} title={`IV ${pct(iv)}`} />
      </div>
      <div className="ends">
        <span>HV {pct(band.min)}</span>
        <span>HV {pct(band.max)}</span>
      </div>
      <div className="cap">
        Marker = this option&apos;s IV against the stock&apos;s 52-week realized-vol range. Left is cheap.
      </div>
    </div>
  );
}

function BestCard({ row, band }) {
  if (!row) return null;
  const isCall = row.type === 'call';
  return (
    <div className={`card ${row.type}`}>
      <div className="eyebrow">Cheapest volatility</div>
      <div className="side">{isCall ? 'BEST CALL' : 'BEST PUT'}</div>
      <div className="headline">
        <span className="ratio" style={{ color: ratioColor(row.ivHv) }}>{fix(row.ivHv, 2)}</span>
        <span className="ratiolab">IV / HV</span>
      </div>
      <Gauge iv={row.iv} band={band} />
      <div className="grid2">
        <div className="cell"><div className="k">Strike</div><div className="v">{money(row.strike)}</div></div>
        <div className="cell"><div className="k">Expiry · DTE</div><div className="v">{dateStr(row.expiration)} · {row.dte}d</div></div>
        <div className="cell"><div className="k">IV last</div><div className="v">{pct(row.iv)}</div></div>
        <div className="cell"><div className="k">Premium</div><div className="v">{money(row.premium)}</div></div>
        <div className="cell"><div className="k">Delta</div><div className="v">{fix(row.delta, 3)}</div></div>
        <div className="cell"><div className="k">Gamma</div><div className="v">{fix(row.gamma, 4)}</div></div>
        <div className="cell"><div className="k">Theta /day</div><div className="v">{fix(row.theta, 3)}</div></div>
        <div className="cell"><div className="k">Breakeven</div><div className="v">{money(row.breakeven)}</div></div>
      </div>
    </div>
  );
}

const COLS = [
  { key: 'type', label: 'Type', sort: (a, b) => a.type.localeCompare(b.type) },
  { key: 'strike', label: 'Strike' },
  { key: 'expiration', label: 'Expiry' },
  { key: 'dte', label: 'DTE' },
  { key: 'iv', label: 'IV' },
  { key: 'ivHv', label: 'IV/HV' },
  { key: 'delta', label: 'Delta' },
  { key: 'gamma', label: 'Gamma' },
  { key: 'theta', label: 'Theta' },
  { key: 'premium', label: 'Premium' },
  { key: 'breakeven', label: 'B/E' },
  { key: 'volume', label: 'Vol' },
  { key: 'openInterest', label: 'OI' },
];

export default function Screener() {
  const [ticker, setTicker] = useState('');
  const [rate, setRate] = useState('4.3');
  const [comm, setComm] = useState('0.65');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [side, setSide] = useState('all');
  const [sortKey, setSortKey] = useState('ivHv');
  const [asc, setAsc] = useState(true);
  const [expFilter, setExpFilter] = useState('all');
  const [minStrike, setMinStrike] = useState('');
  const [maxStrike, setMaxStrike] = useState('');
  const [minVol, setMinVol] = useState('');

  async function run() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setErr('');
    setData(null);
    try {
      const q = new URLSearchParams({ ticker: t, rate, commission: comm });
      const res = await fetch(`/api/options?${q}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const visibleRows = useMemo(() => {
    if (!data) return [];
    let rows = data.rows.filter((r) => side === 'all' || r.type === side);
    if (expFilter !== 'all') rows = rows.filter((r) => String(r.expiration) === expFilter);
    if (minStrike) rows = rows.filter((r) => r.strike >= +minStrike);
    if (maxStrike) rows = rows.filter((r) => r.strike <= +maxStrike);
    if (minVol) rows = rows.filter((r) => (r.volume || 0) >= +minVol);
    const col = COLS.find((c) => c.key === sortKey);
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = col?.sort ? col.sort(a, b) : (av ?? Infinity) - (bv ?? Infinity);
      return asc ? cmp : -cmp;
    });
    return rows;
  }, [data, side, sortKey, asc, expFilter, minStrike, maxStrike, minVol]);

  const expirations = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.rows.map((r) => r.expiration))].sort((a, b) => a - b);
  }, [data]);

  function toggleSort(key) {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(true); }
  }

  return (
    <>
      <div className="controls">
        <div className="field full">
          <label>US ticker</label>
          <input
            value={ticker}
            placeholder="AAPL"
            autoFocus
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
        </div>
        <div className="field">
          <label>Risk-free % <Info text="Безрисков лихвен процент (напр. доходност на US Treasury). Използва се в модела за цена на опциите. Малко влияние — обикновено не се пипа, ~4-4.5%." /></label>
          <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </div>
        <div className="field">
          <label>Commission /contract <Info text="Таксата, която твоят брокер взима за 1 контракт (не bid/ask цена). Влиза в сметката за breakeven." /></label>
          <input value={comm} onChange={(e) => setComm(e.target.value)} inputMode="decimal" />
        </div>
        <button className="run" onClick={run} disabled={loading}>
          {loading ? 'Loading…' : 'Analyze'}
        </button>
      </div>

      {err && <div className="msg err">{err}</div>}
      {!data && !err && !loading && (
        <div className="hint">
          Enter a US stock symbol. The screener pulls the live option chain, computes Black-Scholes
          Greeks, and ranks contracts by <b>IV/HV</b> — implied volatility divided by the stock&apos;s
          realized volatility. A low ratio means the option is pricing in less movement than the stock
          has actually delivered, i.e. comparatively cheap to buy.
        </div>
      )}

      {data && (
        <>
          <div className="summary">
            <div className="sym">{data.ticker}<span className="co">{data.name}</span></div>
            <div className="stat"><div className="k">Price</div><div className="v">{money(data.spot)}</div></div>
            <div className="stat"><div className="k">ATM IV</div><div className="v">{pct(data.hv.atmIv)}</div></div>
            <div className="stat"><div className="k">HV 20d</div><div className="v">{pct(data.hv.hv20)}</div></div>
            <div className="stat"><div className="k">HV 30d</div><div className="v">{pct(data.hv.hv30)}</div></div>
            <div className="stat">
              <div className="k">HV 52w range</div>
              <div className="v">{data.hv.band52w ? `${pct(data.hv.band52w.min)}–${pct(data.hv.band52w.max)}` : '—'}</div>
            </div>
          </div>

          <div className="cards">
            <BestCard row={data.bestCall} band={data.hv.band52w} />
            <BestCard row={data.bestPut} band={data.hv.band52w} />
          </div>

          <div className="tablehead">
            <h2>{visibleRows.length} liquid contracts</h2>
            <div className="filters">
              {['all', 'call', 'put'].map((s) => (
                <button key={s} className={side === s ? 'on' : ''} onClick={() => setSide(s)}>
                  {s === 'all' ? 'All' : s === 'call' ? 'Calls' : 'Puts'}
                </button>
              ))}
            </div>
          </div>

          <div className="tablefilters">
            <div className="field">
              <label>Expiry</label>
              <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                <option value="all">All dates</option>
                {expirations.map((e) => (
                  <option key={e} value={e}>{dateStr(e)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Min strike</label>
              <input value={minStrike} onChange={(e) => setMinStrike(e.target.value)} placeholder="—" inputMode="decimal" />
            </div>
            <div className="field">
              <label>Max strike</label>
              <input value={maxStrike} onChange={(e) => setMaxStrike(e.target.value)} placeholder="—" inputMode="decimal" />
            </div>
            <div className="field">
              <label>Min volume</label>
              <input value={minVol} onChange={(e) => setMinVol(e.target.value)} placeholder="—" inputMode="numeric" />
            </div>
          </div>

          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}>
                      {c.label}{sortKey === c.key ? (asc ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, i) => (
                  <tr key={r.contractSymbol || i}>
                    <td><span className={`tag ${r.type}`}>{r.type === 'call' ? 'C' : 'P'}</span></td>
                    <td className={r.inTheMoney ? 'itm' : ''}>{fix(r.strike, 2)}</td>
                    <td>{dateStr(r.expiration)}</td>
                    <td>{r.dte}</td>
                    <td>{pct(r.iv)}</td>
                    <td style={{ color: ratioColor(r.ivHv), fontWeight: 600 }}>{fix(r.ivHv, 2)}</td>
                    <td>{fix(r.delta, 3)}</td>
                    <td>{fix(r.gamma, 4)}</td>
                    <td>{fix(r.theta, 3)}</td>
                    <td>{money(r.premium)}</td>
                    <td>{money(r.breakeven)}</td>
                    <td>{r.volume}</td>
                    <td>{r.openInterest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="foot">
            <b>How to read it.</b> IV/HV below ~0.8 (green) = the option is pricing in less movement than
            the stock recently delivered — relatively cheap for a buyer. Above ~1.4 (red) = expensive.
            Greeks are Black-Scholes estimates; HV is realized volatility, a free stand-in for true
            historical implied volatility. Data is delayed and unofficial (Yahoo Finance). This is an
            analysis tool, <b>not financial advice</b>.
          </div>
        </>
      )}
    </>
  );
}

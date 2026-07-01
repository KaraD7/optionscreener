'use client';

import { useMemo, useState } from 'react';
import { pct, fix, money, dateStr, ratioColor } from '../../lib/format';
import { analyze } from '../../lib/analysis';
import Info from './Info';
import { useLanguage } from './LanguageContext';

function Gauge({ iv, band, t }) {
  if (!band || band.max <= band.min) {
    return <div className="gauge"><div className="cap">{t('gaugeNoRange')}</div></div>;
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
      <div className="cap">{t('gaugeCaption')}</div>
    </div>
  );
}

function BestCard({ row, band, eyebrow, sideLabel, onClose, t }) {
  if (!row) return null;
  return (
    <div className={`card ${row.type}`}>
      {onClose && (
        <button className="cardclose" onClick={onClose} aria-label="Close">×</button>
      )}
      <div className="eyebrow">{eyebrow}</div>
      <div className="side">{sideLabel}</div>
      <div className="headline">
        <span className="ratio" style={{ color: ratioColor(row.ivHv) }}>{fix(row.ivHv, 2)}</span>
        <span className="ratiolab">{t('ivHvLabel')}</span>
      </div>
      <Gauge iv={row.iv} band={band} t={t} />
      <div className="grid2">
        <div className="cell"><div className="k">{t('strike')}</div><div className="v">{money(row.strike)}</div></div>
        <div className="cell"><div className="k">{t('expiryDte')}</div><div className="v">{dateStr(row.expiration)} · {row.dte}d</div></div>
        <div className="cell"><div className="k">{t('ivLast')}</div><div className="v">{pct(row.iv)}</div></div>
        <div className="cell"><div className="k">{t('premium')}</div><div className="v">{money(row.premium)}</div></div>
        <div className="cell"><div className="k">{t('delta')}</div><div className="v">{fix(row.delta, 3)}</div></div>
        <div className="cell"><div className="k">{t('gamma')}</div><div className="v">{fix(row.gamma, 4)}</div></div>
        <div className="cell"><div className="k">{t('thetaDay')}</div><div className="v">{fix(row.theta, 3)}</div></div>
        <div className="cell"><div className="k">{t('breakeven')}</div><div className="v">{money(row.breakeven)}</div></div>
      </div>
    </div>
  );
}

function SelectedAnalysis({ a, t }) {
  if (!a) return null;
  const good = a.verdict.factors.filter((f) => f.tone === 'good');
  const bad = a.verdict.factors.filter((f) => f.tone === 'bad');
  return (
    <div className="card">
      <div className="eyebrow">{t('overallRec')}</div>
      <div className="miniverdict">
        <div className="mvhead">
          <span className={`mvbadge ${a.verdict.badgeTone}`}>{a.verdict.badge}</span>
          <span className="mvpop">{t('popInline', { pop: (a.pop * 100).toFixed(0) })}</span>
        </div>
        <p className="mvsummary">{a.verdict.summary}</p>
        {good.length > 0 && (
          <div className="mvcol good">
            <div className="mvlabel">{t('goodReasons')}</div>
            <ul>{good.map((f) => <li key={f.label}>{f.note}</li>)}</ul>
          </div>
        )}
        {bad.length > 0 && (
          <div className="mvcol bad">
            <div className="mvlabel">{t('badReasons')}</div>
            <ul>{bad.map((f) => <li key={f.label}>{f.note}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

// 0-100 percentile of this IV within the stock's 52-week HV band — a rough
// proxy for "IV Rank" when we only have realized-vol history, not a real IV history.
function ivRankFromBand(iv, band) {
  if (!band || band.max <= band.min) return null;
  return Math.max(0, Math.min(100, ((iv - band.min) / (band.max - band.min)) * 100));
}

const COLS = [
  { key: 'type', labelKey: 'colType', sort: (a, b) => a.type.localeCompare(b.type) },
  { key: 'strike', labelKey: 'colStrike' },
  { key: 'expiration', labelKey: 'colExpiry' },
  { key: 'dte', labelKey: 'colDte' },
  { key: 'iv', labelKey: 'colIv' },
  { key: 'ivHv', labelKey: 'colIvHv' },
  { key: 'delta', labelKey: 'colDelta' },
  { key: 'gamma', labelKey: 'colGamma' },
  { key: 'theta', labelKey: 'colTheta' },
  { key: 'premium', labelKey: 'colPremium' },
  { key: 'breakeven', labelKey: 'colBE' },
  { key: 'volume', labelKey: 'colVol' },
  { key: 'openInterest', labelKey: 'colOI' },
  { key: 'pop', labelKey: 'colChance' },
  { key: 'dealScore', labelKey: 'colDeal' },
];

export default function Screener() {
  const { t, lang } = useLanguage();
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
  const [selected, setSelected] = useState(null);

  async function run() {
    const tk = ticker.trim().toUpperCase();
    if (!tk) return;
    setLoading(true);
    setErr('');
    setData(null);
    setSelected(null);
    try {
      const q = new URLSearchParams({ ticker: tk, rate, commission: comm });
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

  function analyzeRow(row) {
    const band = data.hv.band52w;
    const hvPct = data.hv.hv30 ? data.hv.hv30 * 100 : data.hv.hv20 ? data.hv.hv20 * 100 : null;
    return analyze({
      type: row.type,
      spot: data.spot,
      strike: row.strike,
      premium: row.premium,
      dteDays: row.dte,
      ivPct: row.iv * 100,
      hvPct,
      ivRankPct: ivRankFromBand(row.iv, band),
      ratePct: rate,
      commission: comm,
      contracts: 1,
      driftMode: 'rf',
      lang,
    });
  }

  const filteredRows = useMemo(() => {
    if (!data) return [];
    let rows = data.rows.filter((r) => side === 'all' || r.type === side);
    if (expFilter !== 'all') rows = rows.filter((r) => String(r.expiration) === expFilter);
    if (minStrike) rows = rows.filter((r) => r.strike >= +minStrike);
    if (maxStrike) rows = rows.filter((r) => r.strike <= +maxStrike);
    if (minVol) rows = rows.filter((r) => (r.volume || 0) >= +minVol);
    return rows;
  }, [data, side, expFilter, minStrike, maxStrike, minVol]);

  const analyzedRows = useMemo(() => {
    if (!data) return [];
    return filteredRows.map((r) => {
      const a = analyzeRow(r);
      return { ...r, pop: a.pop, dealScore: a.verdict.score, dealBadge: a.verdict.badge, dealTone: a.verdict.badgeTone };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows, data, rate, comm, lang]);

  const visibleRows = useMemo(() => {
    const col = COLS.find((c) => c.key === sortKey);
    return [...analyzedRows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = col?.sort ? col.sort(a, b) : (av ?? Infinity) - (bv ?? Infinity);
      return asc ? cmp : -cmp;
    });
  }, [analyzedRows, sortKey, asc]);

  const selectedAnalysis = useMemo(() => {
    if (!selected || !data) return null;
    return analyzeRow(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, data, rate, comm, lang]);

  const expirations = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.rows.map((r) => r.expiration))].sort((a, b) => a - b);
  }, [data]);

  function toggleSort(key) {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(true); }
  }

  function sortDesc(key) {
    setSortKey(key);
    setAsc(false);
  }

  return (
    <>
      <div className="controls">
        <div className="field full">
          <label>{t('tickerLabel')}</label>
          <input
            value={ticker}
            placeholder="AAPL"
            autoFocus
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
        </div>
        <div className="field">
          <label>{t('riskFreeLabel')} <Info text={t('riskFreeInfo')} /></label>
          <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </div>
        <div className="field">
          <label>{t('commissionLabel')} <Info text={t('commissionInfo')} /></label>
          <input value={comm} onChange={(e) => setComm(e.target.value)} inputMode="decimal" />
        </div>
        <button className="run" onClick={run} disabled={loading}>
          {loading ? t('loading') : t('analyze')}
        </button>
      </div>

      {err && <div className="msg err">{err}</div>}
      {!data && !err && !loading && (
        <div className="hint" dangerouslySetInnerHTML={{ __html: t('screenerHint') }} />
      )}

      {data && (
        <>
          <div className="summary">
            <div className="sym">{data.ticker}<span className="co">{data.name}</span></div>
            <div className="stat"><div className="k">{t('price')}</div><div className="v">{money(data.spot)}</div></div>
            <div className="stat"><div className="k">{t('atmIv')}</div><div className="v">{pct(data.hv.atmIv)}</div></div>
            <div className="stat"><div className="k">{t('hv20')}</div><div className="v">{pct(data.hv.hv20)}</div></div>
            <div className="stat"><div className="k">{t('hv30')}</div><div className="v">{pct(data.hv.hv30)}</div></div>
            <div className="stat">
              <div className="k">{t('hvBand')}</div>
              <div className="v">{data.hv.band52w ? `${pct(data.hv.band52w.min)}–${pct(data.hv.band52w.max)}` : '—'}</div>
            </div>
          </div>

          {data.rows.length === 0 && (
            <div className="msg err" style={{ marginTop: 0, marginBottom: 22 }}>
              {t('noReliableIv')}
            </div>
          )}

          <div className="cards">
            <BestCard row={data.bestCall} band={data.hv.band52w} eyebrow={t('cheapestVol')} sideLabel={t('bestCall')} t={t} />
            <BestCard row={data.bestPut} band={data.hv.band52w} eyebrow={t('cheapestVol')} sideLabel={t('bestPut')} t={t} />
          </div>

          {selected && (
            <div className="cards single">
              <BestCard
                row={selected}
                band={data.hv.band52w}
                eyebrow={t('selectedContract')}
                sideLabel={selected.type === 'call' ? t('call') : t('put')}
                onClose={() => setSelected(null)}
                t={t}
              />
              <SelectedAnalysis a={selectedAnalysis} t={t} />
            </div>
          )}

          <div className="tablehead">
            <h2>{t('liquidContracts', { n: visibleRows.length })}</h2>
            <div className="filters">
              {['all', 'call', 'put'].map((s) => (
                <button key={s} className={side === s ? 'on' : ''} onClick={() => setSide(s)}>
                  {s === 'all' ? t('all') : s === 'call' ? t('calls') : t('puts')}
                </button>
              ))}
            </div>
          </div>

          <div className="tablefilters">
            <div className="field">
              <label>{t('expiry')}</label>
              <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                <option value="all">{t('allDates')}</option>
                {expirations.map((e) => (
                  <option key={e} value={e}>{dateStr(e)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('minStrike')}</label>
              <input value={minStrike} onChange={(e) => setMinStrike(e.target.value)} placeholder="—" inputMode="decimal" />
            </div>
            <div className="field">
              <label>{t('maxStrike')}</label>
              <input value={maxStrike} onChange={(e) => setMaxStrike(e.target.value)} placeholder="—" inputMode="decimal" />
            </div>
            <div className="field">
              <label>{t('minVolume')}</label>
              <input value={minVol} onChange={(e) => setMinVol(e.target.value)} placeholder="—" inputMode="numeric" />
            </div>
            <div className="field">
              <label>{t('sortBy')}</label>
              <div className="filters">
                <button className={sortKey === 'pop' ? 'on' : ''} onClick={() => sortDesc('pop')}>{t('bestChance')}</button>
                <button className={sortKey === 'dealScore' ? 'on' : ''} onClick={() => sortDesc('dealScore')}>{t('bestDeal')}</button>
              </div>
            </div>
          </div>

          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} onClick={() => toggleSort(c.key)}>
                      {t(c.labelKey)}{sortKey === c.key ? (asc ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, i) => (
                  <tr
                    key={r.contractSymbol || i}
                    className={selected && (selected.contractSymbol || null) === r.contractSymbol ? 'selected' : ''}
                    onClick={() => setSelected((cur) => (cur && cur.contractSymbol === r.contractSymbol ? null : r))}
                  >
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
                    <td style={{ color: r.pop >= 0.5 ? 'var(--cheap)' : r.pop >= 0.4 ? 'var(--warm)' : 'var(--rich)' }}>{(r.pop * 100).toFixed(0)}%</td>
                    <td style={{ color: `var(--${r.dealTone === 'good' ? 'cheap' : r.dealTone === 'ok' ? 'warm' : 'rich'})`, fontWeight: 600 }}>{r.dealBadge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="foot" dangerouslySetInnerHTML={{ __html: t('screenerFoot') }} />
        </>
      )}
    </>
  );
}

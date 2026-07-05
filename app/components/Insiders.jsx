'use client';

import { useMemo, useState } from 'react';
import { pct, fix, money, dateStr, ratioColor } from '../../lib/format';
import { analyze } from '../../lib/analysis';
import { comparePeriods } from '../../lib/periods';
import { useLanguage } from './LanguageContext';

// The tab keeps the screener's defaults — it's an overview, not a pricing form.
const RATE = 4.3;
const COMM = 0.65;

const usd = (v) =>
  v == null || !Number.isFinite(v) ? '—' : '$' + Math.round(v).toLocaleString('en-US');

function roleOf(tx, t) {
  if (tx.officerTitle) return tx.officerTitle;
  if (tx.isDirector) return t('roleDirector');
  if (tx.isTenPercentOwner) return t('roleTenPct');
  return t('roleInsider');
}

function ClusterCard({ ins, t }) {
  const c = ins.cluster;
  const tone =
    c.level === 'strong' ? 'good' : c.level === 'moderate' ? 'ok' : 'bad';
  const label = t(
    c.level === 'strong'
      ? 'clusterStrong'
      : c.level === 'moderate'
      ? 'clusterModerate'
      : c.level === 'weak'
      ? 'clusterWeak'
      : 'clusterNone'
  );
  const summary = t(
    c.level === 'strong'
      ? 'clusterStrongSummary'
      : c.level === 'moderate'
      ? 'clusterModerateSummary'
      : c.level === 'weak'
      ? 'clusterWeakSummary'
      : 'clusterNoneSummary'
  );
  return (
    <div className="card">
      <div className="eyebrow">{t('clusterEyebrow', { window: c.windowDays })}</div>
      <div className="mvhead" style={{ marginTop: 6 }}>
        <span className={`mvbadge ${tone}`}>{label}</span>
      </div>
      <p className="mvsummary">{summary}</p>
      {c.netSelling && <div className="msg err">{t('clusterNetSelling')}</div>}
      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="cell"><div className="k">{t('statBuyers')}</div><div className="v">{c.distinctBuyers}</div></div>
        <div className="cell"><div className="k">{t('statBuys')}</div><div className="v">{c.buyCount}</div></div>
        <div className="cell"><div className="k">{t('statBuyValue')}</div><div className="v">{usd(c.totalBuyValue)}</div></div>
        <div className="cell"><div className="k">{t('statSells')}</div><div className="v">{c.sellCount} · {usd(c.totalSellValue)}</div></div>
      </div>
    </div>
  );
}

export default function Insiders({ onOpenInScreener }) {
  const { t, lang } = useLanguage();
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [insData, setInsData] = useState(null);
  const [insErr, setInsErr] = useState('');
  const [optData, setOptData] = useState(null);
  const [optErr, setOptErr] = useState('');
  const [periodId, setPeriodId] = useState('p90');

  async function run() {
    const tk = ticker.trim().toUpperCase();
    if (!tk) return;
    setLoading(true);
    setInsErr(''); setOptErr('');
    setInsData(null); setOptData(null);
    const [ins, opt] = await Promise.allSettled([
      fetch(`/api/insiders?ticker=${encodeURIComponent(tk)}`).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Request failed');
        return j;
      }),
      fetch(`/api/options?ticker=${encodeURIComponent(tk)}&rate=${RATE}&commission=${COMM}`).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Request failed');
        return j;
      }),
    ]);
    if (ins.status === 'fulfilled') setInsData(ins.value);
    else setInsErr(ins.reason.message);
    if (opt.status === 'fulfilled') setOptData(opt.value);
    else setOptErr(opt.reason.message);
    setLoading(false);
  }

  // Same per-row verdict the screener computes, minus optional IV Rank.
  const analyzedRows = useMemo(() => {
    if (!optData) return [];
    const hvPct = optData.hv.hv30
      ? optData.hv.hv30 * 100
      : optData.hv.hv20
      ? optData.hv.hv20 * 100
      : null;
    return optData.rows.map((r) => {
      const a = analyze({
        type: r.type,
        spot: optData.spot,
        strike: r.strike,
        premium: r.premium,
        dteDays: r.dte,
        ivPct: r.iv * 100,
        hvPct,
        ratePct: RATE,
        commission: COMM,
        contracts: 1,
        driftMode: 'rf',
        lang,
      });
      return { ...r, pop: a.pop, dealScore: a.verdict.score, dealTone: a.verdict.badgeTone };
    });
  }, [optData, lang]);

  const cmp = useMemo(() => {
    if (!analyzedRows.length) return null;
    return comparePeriods(analyzedRows, insData?.cluster || null);
  }, [analyzedRows, insData]);

  const visibleTx = useMemo(() => {
    if (!insData) return [];
    return insData.transactions.filter((x) => x.code === 'P' || x.code === 'S');
  }, [insData]);

  const selected = cmp?.periods.find((p) => p.id === periodId) || null;
  const periodLabel = { p7: 'periodP7', p50: 'periodP50', p90: 'periodP90', p3m: 'periodP3m' };

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
        <button className="run" onClick={run} disabled={loading}>
          {loading ? t('loading') : t('analyze')}
        </button>
      </div>

      {!insData && !optData && !insErr && !optErr && !loading && (
        <div className="hint" dangerouslySetInnerHTML={{ __html: t('insidersHint') }} />
      )}
      {insErr && <div className="msg err">{insErr}</div>}
      {optErr && <div className="msg err">{optErr}</div>}

      {insData && (
        <>
          <div className="summary">
            <div className="sym">{insData.ticker}<span className="co">{insData.name}</span></div>
            {optData && (
              <div className="stat"><div className="k">{t('price')}</div><div className="v">{money(optData.spot)}</div></div>
            )}
          </div>

          <div className="cards single">
            <ClusterCard ins={insData} t={t} />
          </div>

          <div className="tablehead">
            <h2>{t('txHeading', { days: insData.days })}</h2>
          </div>
          {visibleTx.length === 0 ? (
            <div className="msg err" style={{ marginTop: 0 }}>{t('noTransactions')}</div>
          ) : (
            <div className="tablebox">
              <table>
                <thead>
                  <tr>
                    <th>{t('txDate')}</th>
                    <th>{t('txInsider')}</th>
                    <th>{t('txRole')}</th>
                    <th>{t('txType')}</th>
                    <th>{t('txShares')}</th>
                    <th>{t('txPrice')}</th>
                    <th>{t('txValue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTx.map((x, i) => (
                    <tr key={x.accession + i}>
                      <td>{x.date || x.filingDate}</td>
                      <td>{x.owner}</td>
                      <td>{roleOf(x, t)}</td>
                      <td>
                        <span className={`tag ${x.code === 'P' ? 'call' : 'put'}`}>
                          {x.code === 'P' ? t('txBuy') : t('txSell')}
                        </span>
                      </td>
                      <td>{x.shares != null ? Math.round(x.shares).toLocaleString('en-US') : '—'}</td>
                      <td>{money(x.price)}</td>
                      <td>{usd(x.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {cmp && (
        <>
          <div className="tablehead" style={{ marginTop: 26 }}>
            <h2>{t('periodsHeading')}</h2>
          </div>
          <div className="periods">
            {cmp.periods.map((p) => (
              <button
                key={p.id}
                className={`periodcard ${periodId === p.id ? 'on' : ''} ${cmp.recommendedId === p.id ? 'rec' : ''}`}
                onClick={() => setPeriodId(p.id)}
              >
                <div className="phead">
                  <h3>{t(periodLabel[p.id])}</h3>
                  {cmp.recommendedId === p.id && <span className="recbadge">{t('periodRecommended')}</span>}
                </div>
                <div className="dterange">{t('periodDte', { min: p.dteMin, max: p.dteMax === 3650 ? '∞' : p.dteMax })}</div>
                <div className="pscore">
                  {p.score != null ? p.score.toFixed(1) : '—'}
                  <span> {t('periodScore')}</span>
                </div>
                <ul className="preasons">
                  {p.reasons.map((r, i) => (
                    <li key={i} className={r.tone}>{t(r.key, r.vars)}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {selected?.best && (
            <div className="cards single">
              <div className={`card ${selected.best.type}`}>
                <div className="eyebrow">{t('bestInPeriod')}</div>
                <div className="side">{selected.best.type === 'call' ? t('call') : t('put')}</div>
                <div className="headline">
                  <span className="ratio" style={{ color: ratioColor(selected.best.ivHv) }}>{fix(selected.best.ivHv, 2)}</span>
                  <span className="ratiolab">{t('ivHvLabel')}</span>
                </div>
                <div className="grid2">
                  <div className="cell"><div className="k">{t('strike')}</div><div className="v">{money(selected.best.strike)}</div></div>
                  <div className="cell"><div className="k">{t('expiryDte')}</div><div className="v">{dateStr(selected.best.expiration)} · {selected.best.dte}d</div></div>
                  <div className="cell"><div className="k">{t('ivLast')}</div><div className="v">{pct(selected.best.iv)}</div></div>
                  <div className="cell"><div className="k">{t('premium')}</div><div className="v">{money(selected.best.premium)}</div></div>
                  <div className="cell"><div className="k">{t('colChance')}</div><div className="v">{(selected.best.pop * 100).toFixed(0)}%</div></div>
                  <div className="cell"><div className="k">{t('thetaDay')}</div><div className="v">{fix(selected.best.theta, 3)}</div></div>
                  <div className="cell"><div className="k">{t('delta')}</div><div className="v">{fix(selected.best.delta, 3)}</div></div>
                  <div className="cell"><div className="k">{t('breakeven')}</div><div className="v">{money(selected.best.breakeven)}</div></div>
                </div>
                {onOpenInScreener && (
                  <button
                    className="run"
                    style={{ marginTop: 14 }}
                    onClick={() => onOpenInScreener(optData?.ticker || ticker.trim().toUpperCase())}
                  >
                    {t('openInScreener', { ticker: optData?.ticker || ticker.trim().toUpperCase() })}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {(insData || cmp) && (
        <div className="foot" dangerouslySetInnerHTML={{ __html: t('insidersFoot') }} />
      )}
    </>
  );
}

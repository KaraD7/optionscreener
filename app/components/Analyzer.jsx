'use client';

import { useMemo, useState } from 'react';
import { analyze } from '../../lib/analysis';
import { pct, fix, money, ratioColor } from '../../lib/format';
import PayoffChart from './PayoffChart';
import Info from './Info';
import { useLanguage } from './LanguageContext';

function Field({ label, value, set, placeholder, info }) {
  return (
    <div className="field">
      <label>{label} {info && <Info text={info} />}</label>
      <input
        value={value}
        placeholder={placeholder}
        inputMode="decimal"
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
}

export default function Analyzer() {
  const { t, lang } = useLanguage();
  const [type, setType] = useState('call');
  const [spot, setSpot] = useState('');
  const [strike, setStrike] = useState('');
  const [premium, setPremium] = useState('');
  const [dte, setDte] = useState('');
  const [iv, setIv] = useState('');
  const [hv, setHv] = useState('');
  const [ivRank, setIvRank] = useState('');
  const [rate, setRate] = useState('4.3');
  const [comm, setComm] = useState('0.65');
  const [qty, setQty] = useState('1');
  const [target, setTarget] = useState('');
  const [drift, setDrift] = useState('rf');
  const [customDrift, setCustomDrift] = useState('8');
  const [horizon, setHorizon] = useState(null); // null => expiration

  const [showGreeks, setShowGreeks] = useState(false);
  const [ibkrScale, setIbkrScale] = useState(true);
  const [mDelta, setMDelta] = useState('');
  const [mGamma, setMGamma] = useState('');
  const [mTheta, setMTheta] = useState('');
  const [mVega, setMVega] = useState('');

  const [submitted, setSubmitted] = useState(false);

  const ready =
    +spot > 0 && +strike > 0 && +premium > 0 && +dte > 0 && +iv > 0;

  const manualGreeks = useMemo(() => {
    const div = ibkrScale ? 100 : 1;
    const conv = (v) => (v === '' || v == null ? '' : +v / div);
    return { delta: conv(mDelta), gamma: conv(mGamma), theta: conv(mTheta), vega: conv(mVega) };
  }, [mDelta, mGamma, mTheta, mVega, ibkrScale]);

  const a = useMemo(() => {
    if (!ready || !submitted) return null;
    const d = +dte;
    return analyze({
      type,
      spot,
      strike,
      premium,
      dteDays: d,
      ivPct: iv,
      hvPct: hv || null,
      ivRankPct: ivRank || null,
      ratePct: rate,
      commission: comm,
      contracts: qty,
      targetPrice: target || null,
      driftMode: drift,
      customDriftPct: customDrift,
      horizonDays: horizon == null ? d : horizon,
      manualGreeks,
      lang,
    });
  }, [ready, submitted, type, spot, strike, premium, dte, iv, hv, ivRank, rate, comm, qty, target, drift, customDrift, horizon, manualGreeks, lang]);

  const dteNum = +dte || 0;
  const hz = horizon == null ? dteNum : horizon;

  return (
    <>
      <div className="analyzer-form">
        <div className="seg">
          <button className={type === 'call' ? 'on call' : ''} onClick={() => setType('call')}>{t('call_')}</button>
          <button className={type === 'put' ? 'on put' : ''} onClick={() => setType('put')}>{t('put_')}</button>
        </div>

        <div className="formgrid">
          <Field label={t('underlyingPrice')} value={spot} set={setSpot} placeholder="24.09" />
          <Field label={t('strikeField')} value={strike} set={setStrike} placeholder="27" />
          <Field label={t('premiumShare')} value={premium} set={setPremium} placeholder="0.40" info={t('premiumShareInfo')} />
          <Field label={t('daysToExpiry')} value={dte} set={setDte} placeholder="142" />
          <Field label={t('ivLastPct')} value={iv} set={setIv} placeholder="20.5" info={t('ivLastInfo')} />
          <Field label={t('ivHistVol')} value={hv} set={setHv} placeholder="95.0" info={t('ivHistVolInfo')} />
          <Field label={t('ivRank')} value={ivRank} set={setIvRank} placeholder="29" info={t('ivRankInfo')} />
          <Field label={t('targetPrice')} value={target} set={setTarget} placeholder="30" info={t('targetPriceInfo')} />
          <Field label={t('contracts')} value={qty} set={setQty} placeholder="1" />
          <Field label={t('riskFreeLabel')} value={rate} set={setRate} info={t('riskFreeInfoAnalyzer')} />
          <Field label={t('commissionLabel')} value={comm} set={setComm} info={t('commissionInfoAnalyzer')} />
          <div className="field">
            <label>{t('driftAssumption')} <Info text={t('driftInfo')} /></label>
            <select value={drift} onChange={(e) => setDrift(e.target.value)}>
              <option value="rf">{t('driftRf')}</option>
              <option value="zero">{t('driftZero')}</option>
              <option value="custom">{t('driftCustom')}</option>
            </select>
          </div>
          {drift === 'custom' && (
            <Field label={t('expectedAnnual')} value={customDrift} set={setCustomDrift} />
          )}
        </div>

        <button className="linklike" onClick={() => setShowGreeks((v) => !v)}>
          {showGreeks ? t('hideManualGreeks') : t('addManualGreeks')}
        </button>
        {showGreeks && (
          <div className="greeksbox">
            <div className="greeksrow">
              <span>{t('valuesAre')}</span>
              <button className={`chip ${ibkrScale ? 'on' : ''}`} onClick={() => setIbkrScale(true)}>
                {t('perContract')}
              </button>
              <button className={`chip ${!ibkrScale ? 'on' : ''}`} onClick={() => setIbkrScale(false)}>
                {t('perShare')}
              </button>
            </div>
            <div className="formgrid" style={{ marginTop: 10 }}>
              <Field label={t('delta')} value={mDelta} set={setMDelta} placeholder="22.646" />
              <Field label={t('gamma')} value={mGamma} set={setMGamma} placeholder="9.002" />
              <Field label={t('thetaDay')} value={mTheta} set={setMTheta} placeholder="-0.410" />
              <Field label={t('vegaOptional')} value={mVega} set={setMVega} placeholder="—" info={t('vegaInfo')} />
            </div>
            <p className="subhint" style={{ marginTop: 8 }}>{t('manualGreeksHint')}</p>
          </div>
        )}

        <button className="run wide" onClick={() => setSubmitted(true)} disabled={!ready}>
          {t('calculate')}
        </button>
      </div>

      {!ready && (
        <div className="hint">{t('notReadyHint')}</div>
      )}

      {ready && !submitted && (
        <div className="hint">{t('readyNotSubmittedHint')}</div>
      )}

      {a && (
        <>
          <div className={`verdict ${a.verdict.badgeTone}`}>
            <div className="vhead">
              <div>
                <div className="eyebrow">{t('modelRead')}</div>
                <div className="badge">{a.verdict.badge}</div>
              </div>
              <div className="chance">
                <div className="big" style={{ color: a.pop >= 0.5 ? 'var(--cheap)' : a.pop >= 0.4 ? 'var(--warm)' : 'var(--rich)' }}>
                  {(a.pop * 100).toFixed(0)}%
                </div>
                <div className="chancelab">
                  {t('chanceOfProfit').split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="vsummary">{a.verdict.summary}</p>
            <div className="factors">
              {a.verdict.factors.map((f) => (
                <div className={`factor ${f.tone}`} key={f.label}>
                  <div className="frow"><span className="fl">{f.label}</span><span className="fv">{f.value}</span></div>
                  <div className="fn">{f.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary">
            <div className="stat"><div className="k">{t('breakeven')}</div><div className="v">{money(a.breakeven)}</div></div>
            <div className="stat"><div className="k">{t('moveToBE')}</div><div className="v">{(a.breakevenMovePct >= 0 ? '+' : '') + pct(a.breakevenMovePct)}</div></div>
            <div className="stat"><div className="k">{t('maxLoss')}</div><div className="v" style={{ color: 'var(--rich)' }}>{money(a.maxLoss)}</div></div>
            <div className="stat"><div className="k">{t('maxProfit')}</div><div className="v" style={{ color: 'var(--cheap)' }}>{a.maxProfit === Infinity ? t('unlimited') : money(a.maxProfit)}</div></div>
            <div className="stat"><div className="k">{t('pFinishItm')}</div><div className="v">{pct(a.pITM)}</div></div>
            <div className="stat"><div className="k">{t('exp1Sigma')}</div><div className="v">{money(a.band.low)}–{money(a.band.high)}</div></div>
          </div>

          <div className="cards">
            <div className="card">
              <div className="eyebrow">{t('greeksNow')}</div>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="cell"><div className="k">{t('delta')}</div><div className="v">{fix(a.greeks.delta, 3)}</div></div>
                <div className="cell"><div className="k">{t('gamma')}</div><div className="v">{fix(a.greeks.gamma, 4)}</div></div>
                <div className="cell"><div className="k">{t('thetaDay')}</div><div className="v">{fix(a.greeks.theta, 3)}</div></div>
                <div className="cell"><div className="k">{t('vega1pct')} <Info text={t('vegaInfo')} /></div><div className="v">{fix(a.greeks.vega, 3)}</div></div>
                <div className="cell"><div className="k">{t('ivHvLabel')}</div><div className="v" style={{ color: ratioColor(a.ivHv) }}>{a.ivHv != null ? fix(a.ivHv, 2) : '—'}</div></div>
                <div className="cell"><div className="k">{t('totalCost')}</div><div className="v">{money(a.totalCost)}</div></div>
              </div>
            </div>

            <div className="card">
              <div className="eyebrow">{hz >= dteNum ? t('payoffAtExpiration') : t('payoffHeld', { held: hz, left: dteNum - hz })}</div>
              <PayoffChart
                curve={a.curve}
                spot={a.spot}
                breakeven={a.breakeven}
                spotLabel={`spot ${money(a.spot)}`}
                beLabel={`B/E ${money(a.breakeven)}`}
              />
              <input
                className="slider"
                type="range"
                min="0"
                max={dteNum}
                value={hz}
                onChange={(e) => setHorizon(+e.target.value)}
              />
              <div className="sliderlab">
                <span>{t('today')}</span><span>{t('expiration')}</span>
              </div>
            </div>
          </div>

          <div className="tablehead"><h2>{t('pnlHeading')}</h2></div>
          <div className="tablebox">
            <table>
              <thead>
                <tr><th>{t('stockPrice')}</th><th>{t('move')}</th><th>{t('pnlPerContract')}</th><th>{t('pnlTotal', { qty })}</th></tr>
              </thead>
              <tbody>
                {a.scenarios.map((s, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'left' }}>{money(s.price)}</td>
                    <td>{(s.changePct >= 0 ? '+' : '') + pct(s.changePct)}</td>
                    <td style={{ color: s.pnlPerContract >= 0 ? 'var(--cheap)' : 'var(--rich)' }}>{money(s.pnlPerContract)}</td>
                    <td style={{ color: s.pnl >= 0 ? 'var(--cheap)' : 'var(--rich)' }}>{money(s.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="foot"
            dangerouslySetInnerHTML={{
              __html: t('analyzerFoot', {
                drift: a.mu === 0 ? t('driftZeroWord') : drift === 'rf' ? t('driftRfWord') : t('driftCustomWord'),
              }),
            }}
          />
        </>
      )}
    </>
  );
}

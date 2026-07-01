'use client';

import { useMemo, useState } from 'react';
import { analyze } from '../../lib/analysis';
import { pct, fix, money, ratioColor } from '../../lib/format';
import PayoffChart from './PayoffChart';

function Field({ label, value, set, placeholder, hint }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        inputMode="decimal"
        onChange={(e) => set(e.target.value)}
      />
      {hint && <span className="subhint">{hint}</span>}
    </div>
  );
}

export default function Analyzer() {
  const [type, setType] = useState('call');
  const [spot, setSpot] = useState('');
  const [strike, setStrike] = useState('');
  const [premium, setPremium] = useState('');
  const [dte, setDte] = useState('');
  const [iv, setIv] = useState('');
  const [hv, setHv] = useState('');
  const [rate, setRate] = useState('4.3');
  const [comm, setComm] = useState('0.65');
  const [qty, setQty] = useState('1');
  const [target, setTarget] = useState('');
  const [drift, setDrift] = useState('rf');
  const [customDrift, setCustomDrift] = useState('8');
  const [horizon, setHorizon] = useState(null); // null => expiration

  const ready =
    +spot > 0 && +strike > 0 && +premium > 0 && +dte > 0 && +iv > 0;

  const a = useMemo(() => {
    if (!ready) return null;
    const d = +dte;
    return analyze({
      type,
      spot,
      strike,
      premium,
      dteDays: d,
      ivPct: iv,
      hvPct: hv || null,
      ratePct: rate,
      commission: comm,
      contracts: qty,
      targetPrice: target || null,
      driftMode: drift,
      customDriftPct: customDrift,
      horizonDays: horizon == null ? d : horizon,
    });
  }, [ready, type, spot, strike, premium, dte, iv, hv, rate, comm, qty, target, drift, customDrift, horizon]);

  const dteNum = +dte || 0;
  const hz = horizon == null ? dteNum : horizon;

  return (
    <>
      <div className="analyzer-form">
        <div className="seg">
          <button className={type === 'call' ? 'on call' : ''} onClick={() => setType('call')}>Call</button>
          <button className={type === 'put' ? 'on put' : ''} onClick={() => setType('put')}>Put</button>
        </div>

        <div className="formgrid">
          <Field label="Underlying price" value={spot} set={setSpot} placeholder="100" />
          <Field label="Strike" value={strike} set={setStrike} placeholder="105" />
          <Field label="Premium / share" value={premium} set={setPremium} placeholder="2.40" />
          <Field label="Days to expiry" value={dte} set={setDte} placeholder="30" />
          <Field label="IV %" value={iv} set={setIv} placeholder="35" />
          <Field label="HV % (optional)" value={hv} set={setHv} placeholder="28" hint="enables the vol-value read" />
          <Field label="Target price (optional)" value={target} set={setTarget} placeholder="115" hint="for reward:risk" />
          <Field label="Contracts" value={qty} set={setQty} placeholder="1" />
          <Field label="Risk-free %" value={rate} set={setRate} />
          <Field label="Commission / contract" value={comm} set={setComm} />
          <div className="field">
            <label>Drift assumption</label>
            <select value={drift} onChange={(e) => setDrift(e.target.value)}>
              <option value="rf">Risk-free</option>
              <option value="zero">Zero (conservative)</option>
              <option value="custom">Custom %</option>
            </select>
          </div>
          {drift === 'custom' && (
            <Field label="Expected annual %" value={customDrift} set={setCustomDrift} />
          )}
        </div>
      </div>

      {!ready && (
        <div className="hint">
          Fill in price, strike, premium, days to expiry and IV. Everything else is optional — add
          HV for the volatility-value read and a target price for reward:risk. The analyzer never
          touches the internet; it’s pure math on your numbers.
        </div>
      )}

      {a && (
        <>
          <div className={`verdict ${a.verdict.badgeTone}`}>
            <div className="vhead">
              <div>
                <div className="eyebrow">Model read</div>
                <div className="badge">{a.verdict.badge}</div>
              </div>
              <div className="chance">
                <div className="big" style={{ color: a.pop >= 0.5 ? 'var(--cheap)' : a.pop >= 0.4 ? 'var(--warm)' : 'var(--rich)' }}>
                  {(a.pop * 100).toFixed(0)}%
                </div>
                <div className="chancelab">chance of profit<br />at expiration</div>
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
            <div className="stat"><div className="k">Breakeven</div><div className="v">{money(a.breakeven)}</div></div>
            <div className="stat"><div className="k">Move to B/E</div><div className="v">{(a.breakevenMovePct >= 0 ? '+' : '') + pct(a.breakevenMovePct)}</div></div>
            <div className="stat"><div className="k">Max loss</div><div className="v" style={{ color: 'var(--rich)' }}>{money(a.maxLoss)}</div></div>
            <div className="stat"><div className="k">Max profit</div><div className="v" style={{ color: 'var(--cheap)' }}>{a.maxProfit === Infinity ? 'Unlimited' : money(a.maxProfit)}</div></div>
            <div className="stat"><div className="k">P(finish ITM)</div><div className="v">{pct(a.pITM)}</div></div>
            <div className="stat"><div className="k">Exp. 1σ range</div><div className="v">{money(a.band.low)}–{money(a.band.high)}</div></div>
          </div>

          <div className="cards">
            <div className="card">
              <div className="eyebrow">Greeks (now)</div>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="cell"><div className="k">Delta</div><div className="v">{fix(a.greeks.delta, 3)}</div></div>
                <div className="cell"><div className="k">Gamma</div><div className="v">{fix(a.greeks.gamma, 4)}</div></div>
                <div className="cell"><div className="k">Theta /day</div><div className="v">{fix(a.greeks.theta, 3)}</div></div>
                <div className="cell"><div className="k">Vega /1%</div><div className="v">{fix(a.greeks.vega, 3)}</div></div>
                <div className="cell"><div className="k">IV / HV</div><div className="v" style={{ color: ratioColor(a.ivHv) }}>{a.ivHv != null ? fix(a.ivHv, 2) : '—'}</div></div>
                <div className="cell"><div className="k">Total cost</div><div className="v">{money(a.totalCost)}</div></div>
              </div>
            </div>

            <div className="card">
              <div className="eyebrow">Payoff — {hz >= dteNum ? 'at expiration' : `${hz}d held, ${dteNum - hz}d left`}</div>
              <PayoffChart curve={a.curve} spot={a.spot} breakeven={a.breakeven} />
              <input
                className="slider"
                type="range"
                min="0"
                max={dteNum}
                value={hz}
                onChange={(e) => setHorizon(+e.target.value)}
              />
              <div className="sliderlab">
                <span>today</span><span>expiration</span>
              </div>
            </div>
          </div>

          <div className="tablehead"><h2>P&amp;L at expiration by stock move</h2></div>
          <div className="tablebox">
            <table>
              <thead>
                <tr><th>Stock price</th><th>Move</th><th>P&amp;L /contract</th><th>P&amp;L total ({qty})</th></tr>
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

          <div className="foot">
            <b>How the verdict works.</b> The “chance of profit” is the probability the stock finishes
            past your breakeven, modeled as a lognormal distribution using your IV as the volatility and
            a <b>{a.mu === 0 ? 'zero' : drift === 'rf' ? 'risk-free' : 'custom'}</b> drift — it is a model
            assumption, not a forecast. The badge is a transparent sum of the factors shown above, with a
            hard cap to “Expensive” when IV is rich versus HV. Greeks are Black-Scholes estimates.
            This is an analysis tool, <b>not financial advice</b>.
          </div>
        </>
      )}
    </>
  );
}

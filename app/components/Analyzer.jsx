'use client';

import { useMemo, useState } from 'react';
import { analyze } from '../../lib/analysis';
import { pct, fix, money, ratioColor } from '../../lib/format';
import PayoffChart from './PayoffChart';
import Info from './Info';

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
    });
  }, [ready, submitted, type, spot, strike, premium, dte, iv, hv, ivRank, rate, comm, qty, target, drift, customDrift, horizon, manualGreeks]);

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
          <Field label="Underlying price" value={spot} set={setSpot} placeholder="24.09" />
          <Field label="Strike" value={strike} set={setStrike} placeholder="27" />
          <Field label="Premium / share" value={premium} set={setPremium} placeholder="0.40" info="Last / mid цена на опцията за 1 акция (не за целия контракт). IBKR я показва като Last, Bid или Ask." />
          <Field label="Days to expiry" value={dte} set={setDte} placeholder="142" />
          <Field label="IV last %" value={iv} set={setIv} placeholder="20.5" info="Implied Volatility на конкретния контракт точно както е показана в IBKR (IV last)." />
          <Field label="IV Hist Vol % (optional)" value={hv} set={setHv} placeholder="95.0" info="Историческата (реализирана) волатилност на акцията, както я показва IBKR (IV Hist Vol). Използва се за сравнение IV/HV." />
          <Field label="52w IV Rank (optional)" value={ivRank} set={setIvRank} placeholder="29" info="Процентил 0-100: къде е текущото IV спрямо диапазона си за последните 52 седмици. IBKR го показва директно." />
          <Field label="Target price (optional)" value={target} set={setTarget} placeholder="30" info="Цена, до която очакваш акцията да стигне — използва се за reward:risk сметката." />
          <Field label="Contracts" value={qty} set={setQty} placeholder="1" />
          <Field label="Risk-free %" value={rate} set={setRate} info="Безрисков лихвен процент (напр. доходност на US Treasury). Влиза в модела за цена на опции. Малко влияние — обикновено се оставя ~4-4.5%." />
          <Field label="Commission / contract" value={comm} set={setComm} info="Таксата на брокера ти за 1 контракт — не bid/ask цена. Влиза в breakeven сметката." />
          <div className="field">
            <label>Drift assumption <Info text="Каква средногодишна доходност приемаш за акцията при смятане на шанса за успех. 'Risk-free' е неутрално моделно допускане, не прогноза." /></label>
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

        <button className="linklike" onClick={() => setShowGreeks((v) => !v)}>
          {showGreeks ? '− Hide' : '+ Add'} manual Greeks (paste from broker)
        </button>
        {showGreeks && (
          <div className="greeksbox">
            <div className="greeksrow">
              <span>Values are</span>
              <button className={`chip ${ibkrScale ? 'on' : ''}`} onClick={() => setIbkrScale(true)}>
                per-contract (IBKR ×100)
              </button>
              <button className={`chip ${!ibkrScale ? 'on' : ''}`} onClick={() => setIbkrScale(false)}>
                per-share
              </button>
            </div>
            <div className="formgrid" style={{ marginTop: 10 }}>
              <Field label="Delta" value={mDelta} set={setMDelta} placeholder="22.646" />
              <Field label="Gamma" value={mGamma} set={setMGamma} placeholder="9.002" />
              <Field label="Theta" value={mTheta} set={setMTheta} placeholder="-0.410" />
              <Field label="Vega (optional)" value={mVega} set={setMVega} placeholder="—" info="С колко се променя цената на опцията при промяна на IV с 1 процентен пункт." />
            </div>
            <p className="subhint" style={{ marginTop: 8 }}>
              Тези стойности само заменят Greeks панела за показване (за да съвпада точно с брокера ти).
              Шансът за успех и P&amp;L таблицата продължават да се смятат от IV, което си въвел горе.
            </p>
          </div>
        )}

        <button className="run wide" onClick={() => setSubmitted(true)} disabled={!ready}>
          Calculate — оцени сделката
        </button>
      </div>

      {!ready && (
        <div className="hint">
          Попълни цена, strike, премия, дни до падеж и IV last. Всичко останало е по желание — HV
          и IV Rank подобряват оценката, target price дава reward:risk. Анализаторът не ползва
          интернет — чиста математика върху твоите числа.
        </div>
      )}

      {ready && !submitted && (
        <div className="hint">Натисни „Calculate", за да видиш P&amp;L, шанс за успех и оценка.</div>
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
                <div className="cell"><div className="k">Vega /1% <Info text="Промяна в цената на опцията при +1 процентен пункт IV." /></div><div className="v">{fix(a.greeks.vega, 3)}</div></div>
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
            assumption, not a forecast. The badge sums the factors above, capped to “Expensive” when IV
            is rich versus HV or IV Rank is very high. Greeks are Black-Scholes unless you supplied your
            own above. This is an analysis tool, <b>not financial advice</b>.
          </div>
        </>
      )}
    </>
  );
}

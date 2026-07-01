import { greeks, normCdf } from './blackscholes.js';

const YEAR = 365;

// P(S_T > barrier) under a lognormal terminal distribution.
// ln S_T ~ N( ln S + (mu - 0.5 sig^2) T , sig^2 T )
function probAbove(spot, barrier, mu, sigma, T) {
  if (barrier <= 0) return 1;
  if (!(T > 0) || !(sigma > 0)) return spot > barrier ? 1 : 0;
  const m = Math.log(spot) + (mu - 0.5 * sigma * sigma) * T;
  const s = sigma * Math.sqrt(T);
  const z = (Math.log(barrier) - m) / s;
  return 1 - normCdf(z);
}

// Value of the option at a future horizon via Black-Scholes (IV held constant).
function valueAt(S, K, Trem, r, sigma, type) {
  return greeks({ S, K, T: Trem, r, sigma, type }).price;
}

/**
 * input: {
 *   type: 'call'|'put', spot, strike, premium (per share), dteDays,
 *   ivPct, hvPct?, ratePct, commission (per contract), contracts,
 *   targetPrice?, driftMode: 'rf'|'zero'|'custom', customDriftPct?,
 *   horizonDays (0..dteDays, days the position is held before valuing)
 * }
 */
export function analyze(input) {
  const type = input.type === 'put' ? 'put' : 'call';
  const spot = +input.spot;
  const K = +input.strike;
  const premium = +input.premium;
  const dte = Math.max(0, +input.dteDays);
  const sigma = (+input.ivPct || 0) / 100;
  const hv = input.hvPct ? +input.hvPct / 100 : null;
  const r = (+input.ratePct || 0) / 100;
  const comm = +input.commission || 0;
  const qty = Math.max(1, +input.contracts || 1);
  const mult = 100 * qty;
  const T = dte / YEAR;

  const mu =
    input.driftMode === 'zero'
      ? 0
      : input.driftMode === 'custom'
      ? (+input.customDriftPct || 0) / 100
      : r;

  const commPerShare = comm / 100;
  const costPerShare = premium + commPerShare;
  const totalCost = costPerShare * mult;

  const breakeven =
    type === 'call' ? K + costPerShare : Math.max(0, K - costPerShare);

  const maxLoss = totalCost; // long option: capped at what you paid
  const maxProfit =
    type === 'call' ? Infinity : Math.max(0, (K - costPerShare) * mult);

  const g = greeks({ S: spot, K, T, r, sigma, type });

  // Optional manual Greeks override (e.g. pasted straight from a broker like
  // IBKR). Only overrides the display values — POP/breakeven/P&L still derive
  // from the IV you entered, so the model stays internally consistent.
  if (input.manualGreeks) {
    const m = input.manualGreeks;
    if (m.delta !== '' && m.delta != null && !Number.isNaN(+m.delta)) g.delta = +m.delta;
    if (m.gamma !== '' && m.gamma != null && !Number.isNaN(+m.gamma)) g.gamma = +m.gamma;
    if (m.theta !== '' && m.theta != null && !Number.isNaN(+m.theta)) g.theta = +m.theta;
    if (m.vega !== '' && m.vega != null && !Number.isNaN(+m.vega)) g.vega = +m.vega;
  }

  // Probabilities (at expiration).
  const pop =
    type === 'call'
      ? probAbove(spot, breakeven, mu, sigma, T)
      : 1 - probAbove(spot, breakeven, mu, sigma, T);
  const pITM =
    type === 'call'
      ? probAbove(spot, K, mu, sigma, T)
      : 1 - probAbove(spot, K, mu, sigma, T);

  // Expected 1-sigma price band at expiration.
  const sd = sigma * Math.sqrt(T);
  const center = Math.log(spot) + (mu - 0.5 * sigma * sigma) * T;
  const band = {
    low: Math.exp(center - sd),
    high: Math.exp(center + sd),
    movePct: Math.exp(sd) - 1, // ~ +1 sigma move fraction
  };

  // P&L scenario grid at expiration across a price range (~ +/-3 sigma, clamped).
  const lo = Math.max(0.01, spot * Math.exp(-3 * sd || -0.4));
  const hi = spot * Math.exp(3 * sd || 0.4);
  const scenarios = [];
  const STEPS = 13;
  for (let i = 0; i < STEPS; i++) {
    const S_T = lo + ((hi - lo) * i) / (STEPS - 1);
    const intrinsic =
      type === 'call' ? Math.max(S_T - K, 0) : Math.max(K - S_T, 0);
    const pnl = (intrinsic - costPerShare) * mult;
    scenarios.push({
      price: S_T,
      changePct: S_T / spot - 1,
      pnl,
      pnlPerContract: (intrinsic - costPerShare) * 100,
    });
  }

  // Payoff curve at the chosen holding horizon (smooth, many points).
  const horizon = Math.min(Math.max(0, +input.horizonDays ?? dte), dte);
  const Trem = (dte - horizon) / YEAR;
  const curve = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const S_T = lo + ((hi - lo) * i) / N;
    const val =
      Trem <= 0
        ? type === 'call'
          ? Math.max(S_T - K, 0)
          : Math.max(K - S_T, 0)
        : valueAt(S_T, K, Trem, r, sigma, type);
    curve.push({ price: S_T, pnl: (val - costPerShare) * mult });
  }

  // ---- Verdict: transparent factors, only those we can compute ----
  const breakevenMovePct = breakeven / spot - 1;
  const ivHv = hv ? sigma / hv : null;
  const needed = Math.abs(breakevenMovePct);
  const expected = band.movePct || 1e-9;
  const reachRatio = needed / expected; // <1 = breakeven inside 1 sigma

  let target = input.targetPrice ? +input.targetPrice : null;
  let rewardRisk = null;
  let profitAtTarget = null;
  if (target) {
    const intr =
      type === 'call' ? Math.max(target - K, 0) : Math.max(K - target, 0);
    profitAtTarget = (intr - costPerShare) * mult;
    rewardRisk = maxLoss > 0 ? profitAtTarget / maxLoss : null;
  }

  const thetaDragPerDay = premium > 0 ? Math.abs(g.theta) / premium : null;

  const factors = [];
  const tone = (good, ok) => (good ? 'good' : ok ? 'ok' : 'bad');

  if (ivHv != null) {
    factors.push({
      label: 'Volatility value (IV/HV)',
      value: ivHv.toFixed(2),
      tone: tone(ivHv < 0.9, ivHv <= 1.15),
      note:
        ivHv < 0.9
          ? 'IV is cheap vs the stock’s realized vol — good for a buyer.'
          : ivHv <= 1.15
          ? 'IV is roughly in line with realized vol.'
          : 'IV is rich vs realized vol — you’re overpaying for movement.',
    });
  }
  if (input.ivRankPct !== '' && input.ivRankPct != null && !Number.isNaN(+input.ivRankPct)) {
    const rank = +input.ivRankPct;
    factors.push({
      label: '52w IV Rank',
      value: rank.toFixed(0),
      tone: tone(rank < 30, rank <= 60),
      note:
        rank < 30
          ? 'IV sits in the low end of its 52-week range — comparatively cheap.'
          : rank <= 60
          ? 'IV sits near the middle of its 52-week range.'
          : 'IV sits in the high end of its 52-week range — comparatively expensive.',
    });
  }
  factors.push({
    label: 'Probability of profit',
    value: (pop * 100).toFixed(0) + '%',
    tone: tone(pop >= 0.5, pop >= 0.4),
    note: `Model chance of finishing past breakeven (${(mu * 100).toFixed(
      1
    )}% drift, IV vol).`,
  });
  factors.push({
    label: 'Move needed to breakeven',
    value:
      (breakevenMovePct >= 0 ? '+' : '') + (breakevenMovePct * 100).toFixed(1) + '%',
    tone: tone(reachRatio <= 1, reachRatio <= 1.5),
    note: `Breakeven sits at ${(reachRatio).toFixed(
      2
    )}× the expected 1σ move (${(expected * 100).toFixed(1)}%).`,
  });
  if (rewardRisk != null) {
    factors.push({
      label: 'Reward : risk at target',
      value: rewardRisk >= 0 ? rewardRisk.toFixed(2) + ' : 1' : 'loss at target',
      tone: tone(rewardRisk >= 2, rewardRisk >= 1),
      note: `Profit at $${target} is ${profitAtTarget >= 0 ? '' : '-'}$${Math.abs(
        profitAtTarget
      ).toFixed(0)} vs max loss $${maxLoss.toFixed(0)}.`,
    });
  }
  if (thetaDragPerDay != null) {
    factors.push({
      label: 'Time decay (theta)',
      value: (thetaDragPerDay * 100).toFixed(1) + '%/day',
      tone: tone(thetaDragPerDay < 0.02, thetaDragPerDay < 0.04),
      note: 'Daily theta as a share of the premium you paid.',
    });
  }

  // Composite read.
  const scoreMap = { good: 1, ok: 0, bad: -1 };
  const sum = factors.reduce((s, f) => s + scoreMap[f.tone], 0);
  const rankVal = input.ivRankPct !== '' && input.ivRankPct != null ? +input.ivRankPct : null;
  const richVol = (ivHv != null && ivHv > 1.2) || (ivHv == null && rankVal != null && rankVal > 80);
  const longShot = pop < 0.25;
  let badge, badgeTone, summary;
  if (richVol) {
    badge = 'Expensive';
    badgeTone = 'bad';
    summary =
      'You’re paying a rich implied vol relative to how the stock actually moves. Even a correct direction call can lose if IV reverts. Hard to justify as a buy.';
  } else if (longShot) {
    badge = 'Long-shot';
    badgeTone = 'bad';
    summary =
      'Cheap volatility alone doesn’t offset this: the model gives the stock a low chance of reaching your breakeven by expiration. Cheap vol makes a bad bet cheaper, not a good one.';
  } else if (sum >= 2) {
    badge = 'Reasonable buy';
    badgeTone = 'good';
    summary =
      'On these inputs the trade screens well: the volatility isn’t overpriced, the breakeven is reachable, and the odds/payoff are acceptable. Still a probabilistic bet, not a sure thing.';
  } else if (sum >= 0) {
    badge = 'Marginal';
    badgeTone = 'ok';
    summary =
      'Mixed. Some factors are fine, others are stretched. Tighten the entry (lower premium / different strike or expiry) or wait for cheaper vol before committing.';
  } else {
    badge = 'Poor';
    badgeTone = 'bad';
    summary =
      'The factors line up against the buyer here — the move needed, the cost, or the odds are working against you. Look for a better structure.';
  }

  return {
    type,
    spot,
    strike: K,
    breakeven,
    costPerShare,
    totalCost,
    maxLoss,
    maxProfit,
    greeks: g,
    pop,
    pITM,
    band,
    mu,
    horizon,
    scenarios,
    curve,
    ivHv,
    breakevenMovePct,
    rewardRisk,
    profitAtTarget,
    target,
    verdict: { badge, badgeTone, summary, factors },
  };
}

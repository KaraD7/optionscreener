// Realized / historical volatility from a series of daily closes.
// Returns annualized decimal vols. Trading-day annualization (252).

const TRADING_DAYS = 252;

function logReturns(closes) {
  const r = [];
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1];
    const b = closes[i];
    if (a > 0 && b > 0) r.push(Math.log(b / a));
  }
  return r;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance =
    arr.reduce((s, x) => s + (x - mean) * (x - mean), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// Annualized HV over the last `window` returns.
export function hv(closes, window) {
  const rets = logReturns(closes);
  if (rets.length < window) return null;
  const slice = rets.slice(-window);
  return stdev(slice) * Math.sqrt(TRADING_DAYS);
}

// Rolling HV (window=30 by default) across the whole series -> {current,min,max}.
// This is our free proxy for "IV 52w": the realized-vol regime over the year.
export function hvRange(closes, window = 30) {
  const rets = logReturns(closes);
  if (rets.length < window) return null;
  const series = [];
  for (let i = window; i <= rets.length; i++) {
    series.push(stdev(rets.slice(i - window, i)) * Math.sqrt(TRADING_DAYS));
  }
  return {
    current: series[series.length - 1],
    min: Math.min(...series),
    max: Math.max(...series),
  };
}

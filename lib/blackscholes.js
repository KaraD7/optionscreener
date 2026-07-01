// Black-Scholes pricing & Greeks. Pure functions, no dependencies.
// All vols are decimals (0.25 = 25%). T in years. r decimal.

// Abramowitz & Stegun 7.1.26 erf approximation (|err| < 1.5e-7)
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}

export function normCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function normPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Returns price + greeks for one option.
// type: 'call' | 'put'
export function greeks({ S, K, T, r, sigma, type }) {
  // Degenerate / expired contracts: return safe values so the UI never breaks.
  if (!(S > 0) || !(K > 0) || !(T > 0) || !(sigma > 0)) {
    const intrinsic =
      type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return {
      price: intrinsic,
      delta: type === 'call' ? (S > K ? 1 : 0) : S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const pdfD1 = normPdf(d1);
  const disc = Math.exp(-r * T);

  const gamma = pdfD1 / (S * sigma * sqrtT);
  const vega = (S * pdfD1 * sqrtT) / 100; // per 1 vol point (1%)

  let price, delta, theta;
  if (type === 'call') {
    const Nd1 = normCdf(d1);
    const Nd2 = normCdf(d2);
    price = S * Nd1 - K * disc * Nd2;
    delta = Nd1;
    theta =
      (-(S * pdfD1 * sigma) / (2 * sqrtT) - r * K * disc * Nd2) / 365; // per day
  } else {
    const Nnd1 = normCdf(-d1);
    const Nnd2 = normCdf(-d2);
    price = K * disc * Nnd2 - S * Nnd1;
    delta = normCdf(d1) - 1;
    theta =
      (-(S * pdfD1 * sigma) / (2 * sqrtT) + r * K * disc * Nnd2) / 365; // per day
  }

  return { price, delta, gamma, theta, vega };
}

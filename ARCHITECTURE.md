# Architecture

## Overview
Next.js 14 (App Router), deployed on Vercel. No database, no auth, no external
API keys. Two independent features share the same UI shell and formatting/math
utilities.

```
┌─────────────────────────────────────────────────────────┐
│  app/page.js  (tab shell: Screener | Trade analyzer)     │
├───────────────────────────┬───────────────────────────────┤
│  app/components/          │  app/components/               │
│  Screener.jsx             │  Analyzer.jsx                  │
│  - fetches /api/options   │  - pure client-side, no fetch  │
│  - table filters/sort     │  - manual input -> lib/analysis│
│  - Best call/put cards    │  - payoff chart + P&L table    │
└──────────┬────────────────┴──────────────┬─────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ app/api/options/route.js│    │ lib/analysis.js              │
│ (server, Node runtime)  │    │ - P&L scenarios + payoff curve│
│ - orchestrates fetch    │    │ - probability of profit      │
│ - filters/ranks contracts│   │ - verdict scoring (factors)  │
└──────────┬───────────────┘    └───────────┬───────────────┘
           │                                 │
           ▼                                 ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ lib/yahoo.js             │    │ lib/blackscholes.js          │
│ - cookie/crumb handshake │    │ - Greeks (delta/gamma/theta/ │
│ - quote, chain, history  │    │   vega), normCdf/normPdf     │
└──────────────────────────┘    └─────────────────────────────┘
                                 lib/volatility.js
                                 - realized vol (HV) from closes
                                 lib/format.js
                                 - shared display formatters
```

## Data flow — Screener
1. User enters a ticker → `GET /api/options?ticker=...&rate=...&commission=...`.
2. Route calls `lib/yahoo.js`:
   - `getOptionMeta` → spot price + list of expiration dates.
   - `getDailyCloses` → 1y of daily closes (for HV).
   - `getChainForDate` → per-expiration calls/puts.
3. Route computes, per contract: Black-Scholes Greeks (`lib/blackscholes.js`),
   IV/HV ratio (`lib/volatility.js` for HV), breakeven.
4. Filters: ±10 strikes around spot, IV > 2% (excludes Yahoo's unreliable
   near-zero IV on 0-1 DTE deep ITM/OTM contracts), OI ≥ 10 or volume ≥ 10.
5. "Best call/put" = lowest IV/HV among contracts with DTE ≥ 2.
6. Returns JSON; `Screener.jsx` renders cards + sortable/filterable table.

## Data flow — Trade analyzer
Fully client-side, zero network calls. `lib/analysis.js`:
1. Black-Scholes price/Greeks from your entered IV (or your manually-pasted
   Greeks, which override the *displayed* values only — probability and P&L
   math always derive from the IV you entered, to stay internally consistent).
2. Probability of profit: lognormal terminal-price model using your IV and a
   chosen drift assumption (risk-free / zero / custom).
3. P&L scenario grid at expiration + a payoff curve at any holding horizon
   (via Black-Scholes repricing at that horizon, not just intrinsic value).
4. Verdict: transparent factor list (IV/HV, IV Rank, POP, breakeven distance,
   reward:risk, theta drag) summed into a badge, with hard caps — "Expensive"
   overrides everything if IV is rich, "Long-shot" overrides everything if POP
   is very low, regardless of how cheap the volatility looks.

## Key constants (tunable)
`app/api/options/route.js`: `MAX_EXPIRATIONS`, `STRIKE_WINDOW`, `MIN_OI`,
`MIN_VOL`, `MIN_IV`, `MIN_DTE_FOR_RANK`.

## Deployment
- Vercel Git integration: push to `main` → production deploy. Push to any
  other branch / open a PR → preview deploy with its own URL.
- `/api/options` runs as a Node.js serverless function (`export const runtime
  = 'nodejs'`), not Edge — needed for the Yahoo cookie/crumb handshake.
- No environment variables required.

## Known fragility
Yahoo Finance is unofficial. If Vercel's datacenter IPs get rate-limited,
`lib/yahoo.js` is the single file to replace (with Tradier's free API or
similar) — the rest of the app only depends on the shape it returns.

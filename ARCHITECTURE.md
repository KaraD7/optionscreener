# Architecture

## Overview
Next.js 16 (App Router), deployed on Vercel. No database, no auth, no external
API keys. Three features share the same UI shell and formatting/math
utilities: the Screener, the Trade analyzer, and the Insiders tab.

```
┌─────────────────────────────────────────────────────────┐
│  app/page.js  (LanguageProvider + tab shell)             │
│  app/components/LanguageContext.jsx                      │
│  - EN/BG toggle, persisted to localStorage                │
├───────────────────────────┬───────────────────────────────┤
│  app/components/          │  app/components/               │
│  Screener.jsx             │  Analyzer.jsx                  │
│  - fetches /api/options   │  - pure client-side, no fetch  │
│  - table filters/sort     │  - manual input -> lib/analysis│
│  - Best/Selected cards,   │  - payoff chart + P&L table    │
│    each run through       │                                 │
│    lib/analysis.js too    │                                 │
└──────────┬────────────────┴──────────────┬─────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ app/api/options/route.js│    │ lib/analysis.js              │
│ (server, Node runtime)  │    │ - P&L scenarios + payoff curve│
│ - orchestrates fetch    │    │ - probability of profit      │
│ - filters/ranks contracts│   │ - verdict scoring (factors,  │
└──────────┬───────────────┘    │   score, translated via      │
           │                    │   lib/i18n.js)                │
           │                     └───────────┬───────────────┘
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
                                 lib/i18n.js
                                 - EN/BG dictionary + t(lang, key, vars)
```

## Data flow — Screener
1. User enters a ticker → `GET /api/options?ticker=...&rate=...&commission=...`.
2. Route calls `lib/yahoo.js`:
   - `getOptionMeta` → spot price + list of expiration dates.
   - `getDailyCloses` → 1y of daily closes (for HV).
   - `getChainForDate` → per-expiration calls/puts.
3. Route computes, per contract: Black-Scholes Greeks (`lib/blackscholes.js`),
   IV/HV ratio (`lib/volatility.js` for HV), breakeven.
4. Filters, applied to the whole contract table (not just Best call/put):
   ±10 strikes around spot; OI ≥ 10 or volume ≥ 10; IV > 2%; DTE ≥ 2 (0-1 DTE
   contracts have near-zero extrinsic value); and `isSyntheticIv()` — skips
   Yahoo's IV-solver fallback values (see "Known fragility" below).
5. "Best call/put" = lowest IV/HV among contracts with |Delta| > 0.05 (so a
   far-OTM, short-dated contract with negligible payoff sensitivity can't win
   the ranking even with a genuine IV). `null` if nothing qualifies.
6. Returns JSON; `Screener.jsx` renders cards + sortable/filterable table,
   clicking a row pins it as a third "Selected contract" card.
7. Client-side, `Screener.jsx` also runs every currently-filtered row (and the
   selected contract) through `lib/analysis.js`'s `analyze()` — same engine
   the Trade analyzer uses — to get a probability of profit and a verdict per
   contract. That powers: the "Selected contract" card's mini-analysis (badge,
   summary, good/bad reasons) and the table's Chance/Deal columns plus the
   "Best chance" / "Best deal" quick-sort buttons (`pop` and `verdict.score`
   respectively). `ivRankPct` here is approximated from where the contract's
   IV sits in the 52-week HV band, since the screener has no real IV history.

## Data flow — Insiders tab
1. User enters a ticker → the tab fetches `/api/insiders?ticker=...` and
   `/api/options?ticker=...` in parallel (each can fail independently; the
   other half still renders).
2. `/api/insiders` (`app/api/insiders/route.js`, Node runtime) calls
   `lib/edgar.js` — the SEC EDGAR data layer, isolated exactly like
   `lib/yahoo.js` (official + free, but swap-friendly):
   - `cikForTicker` → ticker → CIK via `company_tickers.json` (cached in
     module scope for the warm lambda).
   - `data.sec.gov/submissions/CIK{...}.json` → recent Form 4 filings
     (last 90 days, capped at 40 filings).
   - Each filing's ownership XML is fetched and parsed with a minimal
     regex parser (`parseForm4Xml`) — owner name/role + non-derivative
     transactions (code, shares, price, A/D). Zero runtime dependencies.
   - SEC requires a descriptive `User-Agent` with a contact address and
     allows ~10 req/s; filings are fetched in batches of 5.
3. `lib/insiders.js` scores the cluster: open-market purchases (code P) in
   a 30-day window → distinct buyers, total $ bought, executive-title boost;
   levels strong / moderate / weak / none, plus a `netSelling` caution when
   sales are >3× purchases. Awards/grants/exercises (codes A/M/F/G) never
   count as buys; the UI table shows only P and S rows.
4. `lib/periods.js` compares four entry horizons by DTE bucket — 7d (2–10),
   50–60d (40–70), ~90d (71–130), 3+ months (131+). Every screener row is
   first run through `lib/analysis.js` client-side (same as the Screener's
   Chance/Deal columns); each bucket's best contract then gets a combined
   score: `verdict.score + 2×POP − theta-drag penalty + insider-alignment
   bonus`. The alignment bonus (only when the cluster is strong/moderate)
   favors ~90d and 3+ months, because insider-buy signals historically
   resolve over 1–6 months — short-dated options expire before the thesis
   plays out. The best bucket gets a "Recommended" badge; every bucket
   lists its reasons (theta cost/day, exit-before-final-30-days rule,
   lottery-ticket warning on 7d).
5. "Open in Screener" passes the ticker up to `app/page.js`, which switches
   tabs and hands `Screener.jsx` a `preset` prop that preloads the ticker
   and starts the scan.

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
`MIN_VOL`, `MIN_IV`, `MIN_DTE_FOR_RANK`, `MIN_BEST_DELTA`.
`lib/edgar.js`: `MAX_FILINGS`. `lib/insiders.js`: cluster thresholds
($100k/$500k, buyer counts, 3× net-selling ratio). `lib/periods.js`:
`PERIODS` DTE ranges and `INSIDER_ALIGN` bonuses.

## Internationalization
`lib/i18n.js` holds a flat `{ en: {...}, bg: {...} }` dictionary and
`t(lang, key, vars)` (supports `{var}` interpolation). It's used two ways:
- From components, via `useLanguage()` (`app/components/LanguageContext.jsx`),
  which wraps the whole app in `app/page.js` and exposes `{ lang, setLang, t }`.
  `t` here is pre-bound to the current language and persisted to localStorage.
- From `lib/analysis.js` directly (a plain module, not a component) — it takes
  `lang` as an input and calls the exported `t(lang, key, vars)` to build the
  verdict/factor strings, so the analyzer's model output is translated too.

Adding a UI string: add the key to both `en` and `bg` in `lib/i18n.js`, then
call `t('key')` (components) or `t(lang, 'key')` (lib/analysis.js).

## Deployment
- Vercel Git integration: push to `main` → production deploy. Push to any
  other branch / open a PR → preview deploy with its own URL.
- `/api/options` and `/api/insiders` run as Node.js serverless functions
  (`export const runtime = 'nodejs'`), not Edge — needed for the Yahoo
  cookie/crumb handshake and consistent with it for EDGAR.
- No environment variables required.

## Known fragility
Yahoo Finance is unofficial. If Vercel's datacenter IPs get rate-limited,
`lib/yahoo.js` is the single file to replace (with Tradier's free API or
similar) — the rest of the app only depends on the shape it returns.

Separately: Yahoo's own `impliedVolatility` field is frequently unreliable,
independent of rate-limiting. When its solver can't organically price a
contract, it silently returns a value from a small fixed template (within
~2% of an exact power of two × 1/128) instead of failing — observed
identically across unrelated tickers, strikes, and expiries. `isSyntheticIv()`
in `app/api/options/route.js` detects and skips these. In practice this can
still leave few or zero eligible contracts for some tickers/moments (e.g. a
low-realized-vol, densely-listed ETF right at the open) — that's the honest
result of Yahoo not having a trustworthy IV to offer, not a bug in the filter.
The screener surfaces this with an explicit "no reliable IV solve" message
rather than silently rendering fabricated Greeks.

Pattern observed so far: noticeably worse pre-market and right around the
9:30am ET open (16:30 Sofia time), better once the market's been open a
while. Spot-checked 2026-07-02 ~10:52 UTC (pre-market): AAPL 1 row, BA 7
rows, MSFT 0, NVDA 0 — same filtering logic as the day before, so this is
expected variance in Yahoo's feed quality by time of day, not a regression.
If someone reports "barely any contracts show up," check when they tested
before assuming the filters need loosening.

# IV/HV Options Screener

Free, deployable-to-Vercel web app with two modes:

**1. Screener** — enter a US ticker, pull the live option chain, and rank every liquid
contract by **IV / HV** (implied vol ÷ realized vol). Low ratio = the option is pricing in
less movement than the stock recently delivered, i.e. comparatively cheap to *buy*. Returns
best call & best put plus a full sortable table with strike, expiry, IV, IV/HV, Greeks,
premium and breakeven.

**2. Trade analyzer** — type one option's details by hand (price, strike, premium, DTE, IV,
optionally HV / target / drift) and get: P&L across stock moves (table + interactive payoff
curve with a today↔expiration horizon slider), **probability of profit** (lognormal model),
and a transparent **good-trade verdict** scoring volatility value, odds, breakeven
reachability, reward:risk and theta drag. This mode is pure client-side math — no network,
works even if Yahoo is down.

> Analysis tool, **not financial advice**. Data is delayed and unofficial.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New → Project** → import the repo.
3. Framework preset auto-detects **Next.js**. No env vars needed. Deploy.

That's it — the option-chain fetch runs server-side in the `/api/options` function, so
there are no browser CORS issues and no API key.

## How it works

- **Data**: Yahoo Finance endpoints (quote, option chains, 1y daily closes), called
  server-side with a cookie + crumb handshake and a browser User-Agent.
- **Greeks**: computed locally with Black-Scholes (`lib/blackscholes.js`), verified
  against textbook values and put-call parity.
- **HV**: realized volatility from daily log returns, annualized over 252 days
  (`lib/volatility.js`). The 52-week rolling-HV range is the free stand-in for true
  historical *implied* vol.
- **Filters**: ±10 strikes around spot, all expirations (capped at 30), illiquid
  contracts hidden (OI < 10 and volume < 10). Tune the constants at the top of
  `app/api/options/route.js`.

## If Yahoo starts blocking the Vercel IPs

Yahoo is unofficial and can rate-limit datacenter IPs. The entire data layer is isolated
in **`lib/yahoo.js`** — swap it for Tradier's free developer API (official, returns Greeks
and IV directly) without touching the rest of the app. The route only needs the same
shape back: `{ spot, expirations[], calls[], puts[], closes[] }`.

## Tech

Next.js 14 (App Router), React 18, zero runtime dependencies beyond Next/React.

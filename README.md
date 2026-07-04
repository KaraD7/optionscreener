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

Next.js 16 (App Router), React 19, zero runtime dependencies beyond Next/React.

## Workflow: versioning, releases, previews, rollback

This repo uses a standard professional setup — no manual deploy steps, full
history, instant rollback. Full rules for Claude Code sessions live in
`CLAUDE.md`; the technical map lives in `ARCHITECTURE.md`; the human-readable
history lives in `CHANGELOG.md`.

**Day to day:** work on a branch, open a PR. Vercel's GitHub integration
comments a live preview URL on every PR automatically — that's your visual
review step, on the real app, before anything touches production.

**Releasing:**
```bash
git add -A
git commit -m "feat(scope): what changed"
git push
git tag v1.2.0
git push origin v1.2.0
```
The tag push triggers `.github/workflows/release.yml`, which creates a GitHub
Release with notes pulled from `CHANGELOG.md` plus an auto-generated commit
diff. Merging to `main` separately triggers a Vercel production deploy.

**Rollback**, fastest to slowest:
1. Vercel dashboard → Deployments → pick a previous one → *Promote to
   Production*. Seconds, no git needed.
2. `git revert <commit>` or `git checkout v1.0.0` to go back in the repo.
3. Every GitHub Release page has the exact source attached under *Assets* if
   you ever need it outside git entirely.

**One-time setup on GitHub** (after first push): Settings → Actions → General
→ confirm "Read and write permissions" is on for the default `GITHUB_TOKEN`,
so the release workflow can create releases.

# Changelog
All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/), versioning
follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-07-01
### Added
- Manual Greeks override in Trade analyzer (Delta/Gamma/Theta/Vega), with a
  per-contract (IBKR ×100) / per-share scale toggle.
- IBKR-matching field names in Trade analyzer: "IV last %", "IV Hist Vol %",
  "52w IV Rank".
- Bulgarian tooltip ("ⓘ") explanations on Risk-free %, Commission, IV last,
  IV Hist Vol, IV Rank, Target price, Drift assumption, Premium, Vega.
- Explicit "Calculate" button in Trade analyzer (previously computed silently
  on every keystroke).
- Screener table filters: expiration date, min/max strike, min volume; added
  a Volume column.
- "52w IV Rank" verdict factor and a "Long-shot" verdict badge for cases where
  cheap volatility is masking a very low probability of profit.

### Fixed
- Screener could surface a contract with 0.0% IV as "cheapest volatility" —
  Yahoo returns unreliable near-zero IV for deep ITM/OTM contracts with 0-1
  days to expiry (no time value left to solve IV from). Now filtered out
  (`MIN_IV = 2%`, `MIN_DTE_FOR_RANK = 2`) from both the Best call/put picks
  and the ATM IV headline figure.

## [1.0.0] - 2026-06-30
### Added
- Screener: ticker search, live option chain via Yahoo Finance, Black-Scholes
  Greeks, IV/HV ranking, Best call/Best put cards, sortable contract table.
- Trade analyzer: manual single-option entry, P&L scenario table, interactive
  payoff chart with holding-horizon slider, probability of profit, transparent
  verdict scoring.

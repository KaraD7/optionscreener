# CLAUDE.md — Project Workflow

Persistent instructions for Claude Code sessions on this repo. Read this first,
every session.

## What this project is
IV/HV Options Screener + Trade Analyzer. Next.js 14 App Router, deployed on
Vercel. See `ARCHITECTURE.md` for the technical map.

## Versioning
Semantic versioning (`MAJOR.MINOR.PATCH`) in `package.json`.
- **PATCH** (1.0.x): bug fixes, copy/tooltip changes, styling tweaks.
- **MINOR** (1.x.0): new features (new tab, new filter, new field) that don't break existing behavior.
- **MAJOR** (x.0.0): breaking changes (data shape changes, removed features).

## Every session that changes functionality, before committing:
1. Bump the version in `package.json`.
2. Add an entry to `CHANGELOG.md` under `## [Unreleased]`, then move it under a
   new `## [x.y.z] - YYYY-MM-DD` heading when ready to release. Use these
   sub-sections as needed: `Added`, `Changed`, `Fixed`, `Removed`.
3. If the change touches data flow, new modules, or the API contract, update
   `ARCHITECTURE.md` to match reality. Docs that drift from the code are worse
   than no docs — keep them in sync every time, not "later".
4. Run `npm run build` locally and confirm it succeeds before committing.

## Commit messages
Conventional Commits format: `type(scope): summary`.
Types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`.
Example: `feat(analyzer): add manual Greeks override with IBKR scale toggle`

## Releasing
```bash
git add -A
git commit -m "feat(...): ..."
git push
git tag v1.1.0
git push origin v1.1.0
```
Pushing a `v*` tag triggers `.github/workflows/release.yml`, which creates a
GitHub Release automatically (with auto-generated notes from commits since the
last tag). Pushing to `main` triggers a Vercel production deploy automatically
via the Git integration — no manual deploy step needed.

## Previewing changes before merging (the "design preview" step)
Do the work on a branch and open a PR instead of committing straight to
`main`. Vercel's GitHub integration gives every PR its own live preview URL
automatically (posted as a comment on the PR) — that's the equivalent of a
design/mockup review, except it's the real, running app. Merge to `main` only
after checking the preview.

## Rollback / restore
Three layers, fastest first:
1. **Vercel instant rollback** — Vercel dashboard → Deployments → pick any
   previous deployment → "Promote to Production". Takes effect in seconds,
   no git operations needed. This is the fastest fix for "the last deploy
   broke something".
2. **Git tag checkout** — every release is tagged (`v1.0.0`, `v1.1.0`, ...).
   `git checkout v1.0.0` to inspect or `git revert` a bad commit to undo it
   in history without rewriting the past.
3. **GitHub Release restore** — each release page has the exact source zip
   attached (Assets → Source code) if you ever need the code outside git.

## Data layer note
Yahoo Finance (`lib/yahoo.js`) is unofficial and isolated from the rest of the
app on purpose. If it starts failing (Vercel datacenter IPs get rate-limited),
swap that one file for Tradier's free API without touching anything else —
the API route only expects `{ spot, expirations[], calls[], puts[], closes[] }`
back from it.

**"Only 1-2 liquid contracts show up" is very often not a bug.** Yahoo's free
`impliedVolatility` field frequently falls back to a fake placeholder value
instead of a real solve (see `isSyntheticIv()` in `app/api/options/route.js`
and "Known fragility" in `ARCHITECTURE.md`). The app correctly filters those
out rather than showing fabricated Greeks, so the contract count legitimately
drops to a handful — or zero — for many tickers, especially pre-market (well
before 9:30am ET / 16:30 Sofia time). Confirmed live on 2026-07-02 ~10:52 UTC
(pre-market): AAPL 1 row, BA 7 rows, MSFT/NVDA 0 rows, all from the already-
shipped filtering logic, not a regression. Before "fixing" a low contract
count, check the time of day and re-test during US market hours first.

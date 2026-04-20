# marcus-execution-layer — Repo Audit
**Repo:** https://github.com/lionmaker11/marcus-execution-layer
**Audit Date:** 2026-04-03
**Last Commit:** 2026-02-19 — feat: Testing Tasks usability overhaul — lower thresholds, Pine input names, action buttons

## What This Is
marcus-execution-layer is the v1 predecessor to Marcusv2's execution infrastructure. It's the original "Logos + Commodus" web app — a React + Express full-stack dashboard with TypeScript and Drizzle ORM. Per the CLAUDE.md, it contains: Marcus (Pine Script ~3100 lines + 3 libraries), Logos (React monitoring dashboard), Commodus (8 adaptive trade analyzers), Liquidity Shield (ICT Adaptive Stop Loss), and Autarkeia (subscriber fan-out). This is the v1 system that Marcusv2 is rebuilding cleanly from scratch.

## Tech Stack
- Language(s): TypeScript, HTML, CSS, JavaScript
- Framework(s): React + Vite (frontend), Express.js (backend), Drizzle ORM
- Database(s): PostgreSQL
- APIs/Services: Hyperliquid (trade execution), TradingView (Pine Script webhooks)
- Deployment: Railway (railway.json), PM2

## Current State
- ✅ Built and working: Full system running — all 5 components (Marcus sensor, Logos dashboard, Commodus analyzers, Liquidity Shield, Autarkeia fan-out). Backtest engine with 4-tier sweeps. Walk-forward testing. Subscriber portal.
- 🔨 Scaffolded but incomplete: Superseded by Marcusv2 — v1 described in its own CLAUDE.md as "Frankenstein code"
- 📋 Planned but not started: Migration to v2 (ongoing in Marcusv2 repo)

## Activity
- Last meaningful commit: 2026-02-19 — Usability overhaul for Testing Tasks tab (lower thresholds, Pine input names, action buttons)
- Commits in last 30 days: 0
- Active branches: main, staging, feature/adaptive-orb, feature/backtest-engine

## Open Issues / PRs
None

## Health Assessment
STALLING — No commits since 2026-02-19. This is the v1 system being superseded by Marcusv2. It may still be running live while v2 is being built, or it may have been shut down. The staging and feature branches suggest this was actively developed up until the v2 rebuild began.

## Cross-Project Dependencies
- Depends on: marcus (Pine Script indicators), Hyperliquid, PostgreSQL
- Used by: Subscriber accounts (Autarkeia fan-out)

## People Dependencies
T.J. only (subscribers are customers, not collaborators)

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/marcus/ (v1 execution layer)

## Questions for T.J.
1. Is marcus-execution-layer still running live, or has it been shut down in favor of Marcusv2?
2. Are there active subscribers still connected to this v1 system via Autarkeia?
3. What is the cutover plan from v1 to v2?
4. (NEW) Marcusv2 architecture doc confirms v1 "remains untouched and handles all live trading until cutover." How many open positions/trades is v1 managing right now?
5. (NEW) v1 uses a heavy Pine Script indicator (~3100 lines + 3 libraries) while v2 uses a lightweight sensor (~600 lines). Which TradingView indicator/alert is currently firing webhooks to v1?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-02-19 — confirmed
- ✅ VERIFIED: Branches: main, staging, feature/adaptive-orb, feature/backtest-engine — confirmed
- ✅ VERIFIED: React + Express, Drizzle ORM, PostgreSQL, Hyperliquid, Railway — confirmed
- ✅ VERIFIED: 0 commits in last 30 days — confirmed
- ❌ CORRECTED: "This may still be running live while v2 is being built" → CONFIRMED: Marcusv2 architecture doc explicitly states "Both v1 services remain untouched and handle all live trading until cutover." v1 IS running live. This is no longer speculative.
- ❌ CORRECTED: Health assessment says "STALLING" — should be re-evaluated as "INTENTIONALLY FROZEN (LIVE)" — v1 is frozen in code but actively running in production. "Stalling" implies neglect when it's actually the incumbent live system.
- ⚠️ LOW CONFIDENCE: v1 Autarkeia subscriber count — no evidence in repo of active subscriber count

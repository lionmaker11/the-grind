# marcus-execution-layer — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/marcus-execution-layer

## What This Is
The predecessor to Marcusv2. A Replit-built full-stack TypeScript execution layer for the Marcus crypto trading system. Has 5 components: Marcus (Pine Script v6 indicator, ~3100 lines), Logos (React + Express dashboard), Commodus (trade sizing intelligence with 8 analyzers), Liquidity Shield (ICT adaptive stop-loss with 5 evaluators), and Autarkeia (subscriber fan-out). Connected to BTCC exchange API (not Hyperliquid). Has client/server structure with React frontend. Railway + staging/feature deployment branches exist but are inactive.

## Tech Stack
- Languages: TypeScript (client + server)
- Frameworks: React (client), Express (server)
- Databases: PostgreSQL (DATABASE_URL from .env.example)
- External Services (from .env.example):
  - BTCC exchange API (configured via dashboard UI, not env vars per .env.example)
  - PostgreSQL
  - Session encryption (SESSION_SECRET)
  - ACCESS_CODE for dashboard login
- Deployment: Railway (has GitHub Actions deploy workflows for production + staging)

## Current State
- 🔨 Was in progress: Multiple feature branches (adaptive-orb, backtest-engine) exist but are inactive
- ❌ SUPERSEDED: Marcusv2 is the current system. This repo is the precursor. T.J. confirmed Marcusv2 is live on mainnet. marcus-execution-layer used BTCC, Marcusv2 uses Hyperliquid.

## Activity
- Last commit: 2026-02-19T15:13:06Z — feat: Testing Tasks usability overhaul — lower thresholds, P (truncated)
- Commits in last 30 days: 0
- Active branches: feature/adaptive-orb, feature/backtest-engine, main, staging

## Open Issues / PRs
None

## Health
ABANDONED — 0 commits in 30 days. Last commit Feb 19. Superseded by Marcusv2.

## Service Architecture
Railway (from deploy workflows):
- 1 service (full-stack monorepo)
- Production + staging environments

## External Dependencies
- BTCC exchange API (superseded — Marcusv2 uses Hyperliquid)
- PostgreSQL

## Cross-Project Links
- SUPERSEDED by Marcusv2
- Conceptual predecessor — shares architecture concepts but different exchange

## People
T.J.

## Questions for T.J.
1. Is marcus-execution-layer still deployed on Railway, or has it been shut down?
2. Is it safe to archive this repo now that Marcusv2 is live?

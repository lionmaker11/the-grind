# Marcusv2 — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/Marcusv2

## What This Is
Production crypto trading system live on Hyperliquid mainnet (confirmed by T.J., Apr 3 2026). Full-stack Express + React/Vite TypeScript monorepo. Three components: Marcus (signal engine using ICT/ORB methodology, 20 modules), Commodus (adaptive trade sizing, 12 modules, 8 analyzers), and an execution layer with subscriber fan-out (Autarkeia). Has its own Pine Script v6 sensor (pine/marcus_v2_sensor.pine) — does NOT use marcusv3 or marcus-master-indicator. Version 0.8.34 in package.json. All 15+ development phases complete per docs/PHASE-STATUS.md (v0.7.14).

## Tech Stack
- Languages: TypeScript (strict), Pine Script v6, SQL
- Frameworks: Express 5, React 18/Vite, Drizzle ORM, WebSocket (ws), Vitest
- Databases: PostgreSQL (pg + Drizzle, all tables use v2_ prefix to share DB with v1)
- External Services (from .env.example):
  - Hyperliquid — exchange API for trade execution (private keys per session: LDN/NY/LC/ASIA)
  - Resend — subscriber welcome emails, 2FA reminders, trade alerts
  - Anthropic (Claude API) — hypothesis generation for Commodus anomaly detection (optional)
  - Sentry — error monitoring (@sentry/node)
  - TradingView — Pine Script runs here (webhook delivery to server)
- Deployment (from railway.json):
  - 1 service: full Express + React monorepo (startCommand: npm run start)
  - Health check: /api/v2/health

## Current State
- ✅ Working: CONFIRMED LIVE ON MAINNET (T.J. Apr 3). Signal engine (20 modules — HTF bias, MTF structure, ORB detector, breakout, OTE, Silver Bullet, Macro, etc.), Commodus adaptive sizing (12 modules, 5 analyzers), execution layer (order executor, watchdog, position manager), subscriber fan-out (Autarkeia), shadow testing pipeline, backtest engine, edge intelligence layer, daily digest (Claude-powered), subscriber accounts + 2FA auth, Pine Script v6 sensor, full React dashboard (20 pages), WebSocket live updates
- 🔨 In progress: Several active feature branches (session continuity, institutional production, mission control overhaul, mathematical upgrade, session risk allocation, tradfi spot integration, config min RR, trading card levels)
- 📋 Planned: Linear access integration (MV2-235), agent observatory v1
- ❌ Not working / broken: .env.example defaults show V2_EXECUTION_ENABLED=false and V2_EXECUTION_MODE=dry-run — THESE ARE STALE ARTIFACTS per T.J. System is live on mainnet.

## Activity
- Last commit: 2026-04-03T02:41:15Z — feat: add Allowed Trading Days checkboxes to Config page (#365)
- Commits in last 30 days: 270 (verified via pagination: 100+100+70)
- Active branches: develop, main, plus 29 feature/fix branches (feature/MV2-*, fix/MV2-*, feature/aggression-*, feature/choppy-*, etc.)

## Open Issues / PRs
None visible open

## Health
ACTIVE — Most actively developed project. Live on mainnet streaming continuously. 100+ commits in 30 days at the API limit. 29 open feature/fix branches indicate heavy concurrent development.

## Service Architecture
Railway deployment (from railway.json — 1 service):
- Single monorepo service: Express server (API + WebSocket) + React frontend (served via Vite/static)
- Separate PostgreSQL (shared with v1 using v2_ prefix tables)

## External Dependencies
- Hyperliquid SDK (hyperliquid ^1.7.7): Trade execution, position management, account fan-out
- Resend (^6.9.3): Subscriber email notifications (welcome, 2FA, trade alerts)
- Anthropic SDK (@anthropic-ai/sdk ^0.78.0): Commodus hypothesis generation for anomaly analysis (optional per .env.example)
- Sentry (@sentry/node ^10.42.0): Error monitoring
- TradingView: Hosts Pine Script sensor, sends JSON webhooks to the execution layer
- ethers (^6.16.0): Ethereum/EVM utility (present in deps — purpose unclear, possibly for Hyperliquid wallet operations)

## Cross-Project Links
- marcus-execution-layer: SUPERSEDED predecessor. Marcusv2 is the current system.
- marcus (v1): Original Pine Script indicator. Marcusv2 has its OWN sensor (marcus_v2_sensor.pine) and does NOT use v1.
- marcusv3 / marcus-master-indicator: Pine Script v4.0 refactors. Do NOT feed Marcusv2. Independent projects.
- chief-workspace: Chief agent may monitor Marcusv2 (Telegram notifications), but no code dependency.

## People
T.J. — builder and operator. Has subscribers (Autarkeia fan-out to subscriber Hyperliquid accounts).

## Questions for T.J.
1. package.json shows version 0.8.34 but PHASE-STATUS.md was last updated at v0.7.14. Is the PHASE-STATUS doc stale, or are v0.7.x-v0.8.x changes post-phase incremental improvements?
2. How many active subscribers are currently in the Autarkeia fan-out? (Not visible from code)
3. ethers ^6.16.0 is in dependencies — is this for Hyperliquid wallet operations specifically, or is there TradFi/spot trading integration underway?
4. The PHASE-STATUS lists "QA Hardening" as complete (32 findings resolved), but there are still 10+ active fix/* branches. Are these post-QA hardening fixes or ongoing maintenance?

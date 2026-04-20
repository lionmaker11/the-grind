# marcus-execution-layer — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/marcus-execution-layer

## What This Is
The direct predecessor to Marcusv2 (confirmed via CLAUDE.md cross-reference). Contains the full Marcus/Logos/Commodus trading system architecture in an earlier implementation. 181 files including the main trading engine, Commodus intelligence, execution layer, subscriber management, and Pine Script indicator (~3100 lines). Described in its own CLAUDE.md as having components: Marcus (Pine Script), Logos (React + Express dashboard), Commodus (8 analyzers), Liquidity Shield (adaptive SL), Autarkeia (subscriber fan-out). Database uses PostgreSQL, deploys to Railway with staging/production branches.

## Tech Stack
Languages: TypeScript, Pine Script
Frameworks: Express.js, React
Databases: PostgreSQL
External Services (from .env.example — only 3 keys found):
  - PostgreSQL: DATABASE_URL
  - Session: SESSION_SECRET
  - Dashboard access code: ACCESS_CODE (no API key services in .env.example — exchange keys configured via dashboard UI)
Deployment (from railway.json — 1 service):
  - startCommand: npm run start
  - healthcheckPath: /health

## Current State
✅ Working: Was a complete system per the CLAUDE.md description
🔨 In progress: Nothing — superseded by Marcusv2
📋 Planned: Nothing — retired
❌ Broken/placeholder: Superseded — Marcusv2 is the active system

## Activity
Last commit: 2026-02-19 — feat: Testing Tasks usability overhaul — lower thresholds, P...
Commits (30d): 0
Branches: feature/adaptive-orb, feature/backtest-engine, main, staging

## Open Issues / PRs
None

## Health
ABANDONED — Zero commits in 30+ days. Confirmed superseded by Marcusv2 per architectural review. Feature branches (adaptive-orb, backtest-engine) are historical artifacts of features now implemented in Marcusv2.

## External Services (verified from .env.example)
- PostgreSQL: DATABASE_URL
- (Exchange API keys configured via dashboard UI — not in .env.example)

## Cross-Project Links
- Marcusv2: direct successor — all active development moved there

## Questions for T.J.
1. Is it safe to archive marcus-execution-layer? Or do you need to reference its code while building Marcusv2 features?

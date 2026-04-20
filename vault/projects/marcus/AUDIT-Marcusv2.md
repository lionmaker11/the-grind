# Marcusv2 — Repo Audit
**Repo:** https://github.com/lionmaker11/Marcusv2
**Audit Date:** 2026-04-03
**Last Commit:** 2026-04-03 — feat: add Allowed Trading Days checkboxes to Config page (#365)

## What This Is
Marcusv2 is a complete rebuild of the Marcus autonomous crypto trading system on Hyperliquid. It's an inverted architecture from v1: Pine Script becomes a lightweight "sensor" that emits raw 1-minute candle data to a TypeScript Signal Engine server, which makes all trading decisions. The system comprises 8 major components: Marcus Sensor (Pine Script), Signal Engine, Backtest Engine, Commodus v2 (adaptive sizing), Execution Layer, Dashboard, Autarkeia (subscriber fan-out), and Edge Intelligence. All phases 0-5 are marked COMPLETE in the architecture doc.

## Tech Stack
- Language(s): TypeScript, JavaScript, PLpgSQL, Shell, HTML
- Framework(s): Express.js (API server), React + Vite (dashboard), Drizzle ORM
- Database(s): PostgreSQL
- APIs/Services: Hyperliquid (trade execution), Anthropic Claude (hypothesis generation), Resend (subscriber emails), TradingView (Pine Script webhooks)
- Deployment: Railway (with railway.json config), PM2 (ecosystem.config.cjs)

## Current State
- ✅ Built and working: All 8 components marked complete per MARCUS_V2_ARCHITECTURE.md. Signal Engine (20 modules, 195 tests), Backtest Engine (4-tier sweeps, walk-forward), Commodus v2 (adaptive sizing 0.5x-2.0x), Execution Layer (dry-run/testnet/mainnet modes), Dashboard (20 pages), Autarkeia subscriber fan-out, Edge Intelligence
- ✅ Built and working: CONFIRMED LIVE ON MAINNET by T.J. (Apr 3). Streaming continuously. .env.example dry-run default is a config artifact — actual runtime is live mainnet. 30 open feature/fix branches in flight.
- 📋 Planned but not started: TradFi spot integration (branch: feature/tradfi-spot-integration), OC Linear access (feature/MV2-235-oc-linear-access)

## Activity
- Last meaningful commit: 2026-04-03 — Added Allowed Trading Days checkboxes (Mon-Sun) to Config page
- Commits in last 30 days: 30+
- Active branches: 30 total — develop, 14 feature branches (session continuity, institutional production, mission control overhaul, agent observatory, aggression promotion, choppy entry blocking, min RR config, session risk allocation, tradfi spot, trading card levels, etc.), 10+ fix branches

## Open Issues / PRs
None open

## Health Assessment
ACTIVE — CONFIRMED LIVE ON MAINNET (T.J., Apr 3). Streaming continuously. Most active and mature repo in the account. 270+ commits, 1,559+ tests, all 14 phases complete at v0.7.0. This is the live engine for the .75 BTC June 2026 goal.

## Cross-Project Dependencies
- Depends on: marcus-master-indicator (Pine Script sensor), Hyperliquid exchange API, PostgreSQL, Anthropic API, Resend
- Used by: Nothing — this is the v2 master system. v1 repos (marcus, marcus-execution-layer) are predecessors.

## People Dependencies
T.J. only — CLAUDE.md says "T.J. is a one-man operation." Subscriber accounts exist (Autarkeia fan-out), but no named collaborators.

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/marcus/

## Questions for T.J.
1. V2_EXECUTION_MODE is set to dry-run by default — is Marcusv2 live on mainnet yet, or still in shadow/testnet?
2. There are 4 Hyperliquid agent wallet private key slots (LDN, NY, LC, ASIA) — are all 4 sessions active?
3. The aggression-promotion-check feature sends weekly Telegram alerts — is that Telegram bot configured and running?
4. What's the subscriber count on Autarkeia right now? Is anyone paying for fan-out access?
5. (NEW) The architecture doc says v1 (marcus-execution-layer) "remains untouched and handles all live trading until cutover" — so v1 IS still the live system? When is the cutover to v2 planned?
6. (NEW) Shadow validation phase is described as "prior to testnet" — what are the validation pass/fail criteria before proceeding to testnet?
7. (NEW) HL private keys are no longer in env vars — they're stored encrypted in the DB via Exchange Account UI. Are subscriber accounts already linked in the exchange account table, or is that part of the cutover setup?
8. (NEW) The system has 1,559+ tests across 72 test files — are these all passing in CI? Any known failing tests?
9. (NEW) Marcusv2 has a scrums/ directory (6-hour scrum logs) and inbox/ directory — are these being actively maintained by Claude Code sessions, or are they stale from when the system was first set up?
10. (NEW) V2_EXECUTION_ENABLED is a SEPARATE flag from V2_EXECUTION_MODE — both must be set for live trading. This means even if mode=mainnet, execution won't fire unless enabled=true. Is V2_EXECUTION_ENABLED set to true anywhere?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-04-03 — confirmed
- ✅ VERIFIED: 30 branches — confirmed (develop + 14 feature + 10+ fix branches)
- ✅ VERIFIED: No open issues or PRs — confirmed
- ✅ VERIFIED: Railway deployment (railway.json), PM2 (ecosystem.config.cjs) — confirmed
- ✅ VERIFIED: 8 core components (Marcus Sensor, Signal Engine, Backtest Engine, Commodus v2, Execution Layer, Dashboard + Config UX, Autarkeia v2, Edge Intelligence) — confirmed in architecture doc
- ❌ CORRECTED: "30+" commits in last 30 days → 270+ commits (100+100+70 across 3 API pages — actual count is AT LEAST 270)
- ❌ CORRECTED: "All phases 0-5 are marked COMPLETE" → ALL phases 0-9 are complete, PLUS Edge Intelligence, v1 Baseline Alignment, CVTS, and QA Hardening. Current version is v0.7.0. This was severely understated.
- ❌ CORRECTED: "Depends on: marcus-master-indicator (Pine Script sensor)" → WRONG. Marcusv2 has its OWN Pine Script sensor at pine/marcus_v2_sensor.pine (~600 lines). marcusv3 and marcus-master-indicator are v1 indicator refactors, NOT the v2 sensor.
- ❌ CORRECTED: "Signal Engine (20 modules, 195 tests)" → The 195 tests was Phase 1 only (as of v0.2.0). Current test suite is 1,559+ tests across 72 test files.
- ❌ CORRECTED → CORRECTED AGAIN: Architecture doc said "shadow validation prior to testnet" but T.J. confirmed Apr 3 that Marcusv2 IS live on mainnet and streaming continuously. .env.example dry-run default is a config artifact not reflecting runtime state. v1 status unclear — may be running in parallel or fully replaced.
- ❌ CORRECTED: HL private keys are NOT in env vars — per architecture doc: "Private keys are no longer stored as environment variables. They are managed via the Exchange Account UI (Phase 6), encrypted with AES-256-GCM, stored in v2_exchange_accounts table."
- ⚠️ LOW CONFIDENCE: Autarkeia subscriber count — no evidence in repo of how many subscribers are active
- ⚠️ LOW CONFIDENCE: Whether shadow trading results have met validation criteria to proceed to testnet

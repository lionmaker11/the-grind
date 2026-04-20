# marcusv3 — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/marcusv3

## What This Is
A Pine Script v6 refactor of the Marcus v3.0.3 indicator, decomposed into focused libraries. The repo is named "marcusv3" but the folder structure is marcus-v4/ — this is actually the v4.0 architecture upgrade. Contains 13 Pine Script library files (MarcusUtils, MarcusSession, MarcusORB, MarcusICT, MarcusOTE, MarcusTargets, MarcusMode, MarcusPerf, MarcusConf, MarcusRisk, MarcusTrade, MarcusBridge, MarcusDash) plus a main Marcus.pine. Key additions: Adaptive ORB locking (from v2 Sensor), Sharpe/Omega intelligence (new). Does NOT feed Marcusv2.

## Tech Stack
- Languages: Pine Script v6
- Frameworks: TradingView (native platform)
- Databases: None
- External Services: TradingView only
- Deployment: TradingView (publish libraries + indicator)

## Current State
- ✅ Working: All 13 library files exist, main Marcus.pine exists, bug fixes applied (last commit)
- 🔨 In progress: Active branch (claude/marcus-v4-refactor-hlrBj) — refactor still in progress
- 📋 Planned: Integration of adaptive ORB and Sharpe/Omega into production
- ❌ Not working / broken: No main branch (no default branch named "main") — all work on claude/ branch

## Activity
- Last commit: 2026-03-12T21:07:55Z — Fix 4 bugs found during code review (MarcusBridge, MarcusORB, MarcusICT fixes)
- Commits in last 30 days: 5
- Active branches: claude/marcus-v4-refactor-hlrBj (only branch)

## Open Issues / PRs
None

## Health
STALLING — Last commit Mar 12. 5 commits in 30 days but declining. Single branch, no main. Appears to be an active-but-slow refactor that hasn't been published to TradingView yet.

## Service Architecture
None — TradingView-only.

## External Dependencies
TradingView only (platform hosts Pine Script libraries).

## Cross-Project Links
- Does NOT feed Marcusv2 (Marcusv2 has its own sensor: marcus_v2_sensor.pine)
- Related to marcus-master-indicator (same v4 architecture — parallel repos)
- Based on marcus (v1 original Pine Script)

## People
T.J.

## Questions for T.J.
1. Why are marcusv3 and marcus-master-indicator separate repos with identical structure? What's the distinction between them?
2. Is v4 intended to eventually replace Marcusv2's Pine Script sensor, or is it a completely independent indicator?

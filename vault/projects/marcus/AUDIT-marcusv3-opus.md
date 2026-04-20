# marcusv3 — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/marcusv3

## What This Is
Despite the repo name "marcusv3," the actual code is a Marcus v4.0 Pine Script indicator decomposed into libraries — stored in a marcus-v4/ subdirectory. 14 Pine Script v6 library files + one main Marcus.pine indicator. The v4 architecture extracts logic from v3.0.3 (monolithic ~2400 lines) into named, focused libraries: ICT logic, ORB detection, OTE zones, confidence scoring, risk management, trade management, session timing, performance (Sharpe/Omega), dashboard, and webhook bridge. This feeds signals to Marcusv2's execution system.

## Tech Stack
Languages: Pine Script v6
Frameworks: TradingView (platform, not a framework)
Databases: None
External Services: None (TradingView-only indicator)
Deployment: Published to TradingView (no cloud deployment)

## Current State
✅ Working:
  - All 14 libraries + main indicator scaffold implemented
  - Adaptive ORB locking (replaces fixed-time accumulation)
  - Sharpe/Omega performance intelligence layer (MarcusPerf.pine)
  - Library decomposition preserves all 17 alertcondition() declarations

🔨 In progress:
  - open branch: claude/marcus-v4-refactor-hlrBj (all v4 work is on this branch — main appears empty or not updated)

📋 Planned:
  - v4.0.0 release to production TradingView indicator

❌ Broken/placeholder:
  - All work on claude/ branch — main branch status unclear (may be empty or v3)

## Activity
Last commit: 2026-03-12 — Fix 4 bugs found during code review
Commits (30d): 5
Branches: claude/marcus-v4-refactor-hlrBj (only branch listed — main not shown)

## Open Issues / PRs
None

## Health
STALLING — 5 commits all around 2026-03-12, no activity for ~22 days. The v4 refactor appears to be parked. Marcusv2 uses the existing Pine sensor (marcus_v2_sensor.pine in Marcusv2 repo) — v4 libraries have not yet been integrated.

## External Services (verified from .env.example)
None — no .env.example. TradingView-only.

## Cross-Project Links
- Marcusv2: v4 indicator would replace marcusv2's marcus_v2_sensor.pine when complete
- marcus-master-indicator: appears to be the same v4 codebase in a different repo (identical 15-file structure) — likely the authoritative version

## Questions for T.J.
1. Is marcusv3 the working repo for v4 development, or is marcus-master-indicator? They have identical file structures — which one is canonical?
2. Is v4 development paused intentionally while Marcusv2 execution is the priority?

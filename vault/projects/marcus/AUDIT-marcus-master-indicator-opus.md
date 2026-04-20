# marcus-master-indicator — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/marcus-master-indicator

## What This Is
Marcus v4.0 Pine Script indicator — the authoritative version of the library-decomposed indicator architecture. 14 Pine Script v6 libraries (MarcusUtils, MarcusSession, MarcusORB, MarcusICT, MarcusOTE, MarcusTargets, MarcusMode, MarcusPerf, MarcusConf, MarcusRisk, MarcusTrade, MarcusBridge, MarcusDash) plus one main Marcus.pine orchestrator. Files sit at root level (not in a subdirectory). CLAUDE.md is identical in intent to marcusv3/marcus-v4/CLAUDE.md — same rules, same architecture. This is likely the intended deployment target for the v4 indicator.

## Tech Stack
Languages: Pine Script v6
Frameworks: TradingView
Databases: None
External Services: None
Deployment: TradingView (no cloud deployment)

## Current State
✅ Working:
  - Full 14-library structure implemented
  - Adaptive ORB (MarcusORB.pine)
  - Sharpe/Omega intelligence (MarcusPerf.pine)
  - All 17 alertcondition() declarations preserved

🔨 In progress:
  - Open branch: claude/marcus-v4-refactor-ARSZY (all development here)

📋 Planned:
  - Production deployment to TradingView as replacement for v3 indicator

❌ Broken/placeholder:
  - Not yet deployed to production TradingView

## Activity
Last commit: 2026-03-12 — fix(v4): apply all simplify review findings — blockers, warnings, style
Commits (30d): 2
Branches: claude/marcus-v4-refactor-ARSZY

## Open Issues / PRs
None

## Health
STALLING — 2 commits around 2026-03-12, stopped. Same state as marcusv3 — v4 indicator work is parked while Marcusv2 execution work continues at high velocity.

## External Services (verified from .env.example)
None — no .env.example.

## Cross-Project Links
- marcusv3: duplicate v4 codebase — this repo appears to be the canonical version (files at root, not in subdirectory)
- Marcusv2: v4 indicator intended to replace current marcus_v2_sensor.pine when ready

## Questions for T.J.
1. Between marcusv3 and marcus-master-indicator, which is the one you're actually developing v4 in? The structures are identical — one of these is redundant.

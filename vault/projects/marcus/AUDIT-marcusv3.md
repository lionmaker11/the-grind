# marcusv3 — Repo Audit
**Repo:** https://github.com/lionmaker11/marcusv3
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-12 — Fix 4 bugs found during code review

## What This Is
marcusv3 contains the Marcus v4.0 Pine Script indicator — a TradingView Pine Script v6 indicator called "Marcus the Money Printer v4.0" built on the v3.0.3 foundation. It uses a library decomposition architecture (extracting indicator logic into separate Pine Script libraries), adds Adaptive ORB locking (MarcusORB library), and a Sharpe/Omega performance intelligence engine (MarcusPerf library). The repo structure is a single folder (marcus-v4/) containing CLAUDE.md, Marcus.pine, and a /libraries/ subdirectory — this is purely Pine Script code intended for TradingView deployment.

## Tech Stack
- Language(s): Pine Script v6
- Framework(s): TradingView (Pine Script runtime)
- Database(s): None
- APIs/Services: TradingView (webhook alerts to Execution Layer)
- Deployment: Published to TradingView Pine Script editor manually

## Current State
- ✅ Built and working: v4.0 indicator with Adaptive ORB locking and Sharpe/Omega quality engine. 5 commits on 2026-03-12 addressing v3 feature ports, Pine Script syntax fixes, and code review bugs.
- 🔨 Scaffolded but incomplete: Library system requires manual publish of each library to TradingView with the correct username — deployment instructions in Marcus.pine say "Replace YOUR_TV_USERNAME below with your TradingView username"
- 📋 Planned but not started: Unknown — repo appears to be in maintenance/complete state

## Activity
- Last meaningful commit: 2026-03-12 — Fixed 4 bugs from code review (MarcusBridge entry/reentry JSON fixes)
- Commits in last 30 days: 5
- Active branches: claude/marcus-v4-refactor-hlrBj (this is the default branch — never merged to main)

## Open Issues / PRs
None

## Health Assessment
STALLING — 5 commits on 2026-03-12, nothing since. The default branch is still a claude/ feature branch (same pattern as polytrade — work done in a feature branch, never merged). Marcusv2 appears to be the active development focus now, which supersedes this indicator-only repo.

## Cross-Project Dependencies
- Depends on: TradingView account (manual publish), Marcusv2 or marcus-execution-layer (receives webhooks)
- Used by: Marcusv2 (marcus-master-indicator serves as the Pine Script sensor)

## People Dependencies
T.J. only (TradingView account holder)

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/marcus/ (Pine Script v4 indicator)

## Questions for T.J.
1. Is the v4.0 indicator in marcusv3 actually published on TradingView and running live, or is it still unpublished?
2. How does this relate to marcus-master-indicator? Are they the same Pine Script at different stages?
3. Should the claude/ feature branch be merged to main and this repo archived in favor of marcusv2's sensor?
4. (NEW) marcusv3 and marcus-master-indicator are v1 indicator refactors — they are SEPARATE from the Marcusv2 sensor (pine/marcus_v2_sensor.pine). Are these v4.0 repos still intended to be used with the v1 execution layer, or were they the failed attempt to upgrade v1 before committing to the full v2 rebuild?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-12, 5 commits total — confirmed
- ✅ VERIFIED: Single branch: claude/marcus-v4-refactor-hlrBj — confirmed
- ❌ CORRECTED: "Active branches: claude/marcus-v4-refactor-hlrBj (this is the default branch — never merged to main)" → There IS NO main branch in this repo at all. The claude/ branch is the ONLY branch and the only commit history. The audit's phrasing implied there was a main branch to merge into — there isn't one.
- ❌ CORRECTED: Cross-project dependency — "Used by: Marcusv2 (marcus-master-indicator serves as the Pine Script sensor)" → WRONG. Marcusv2 has its OWN Pine Script sensor (pine/marcus_v2_sensor.pine). These v4.0 repos are v1 indicator refactors, not the v2 sensor.
- ⚠️ LOW CONFIDENCE: Whether this v4.0 indicator is published on TradingView. The deployment instructions in Marcus.pine say "Replace YOUR_TV_USERNAME" — suggesting it was never completed.

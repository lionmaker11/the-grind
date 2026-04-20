# marcus — Repo Audit
**Repo:** https://github.com/lionmaker11/marcus
**Audit Date:** 2026-04-03
**Last Commit:** 2026-02-15 — Remove intelligence bridge from Pine Script — Commodus computes server-side

## What This Is
The marcus repo is the original v1 Pine Script indicator codebase. It contains multiple Pine Script files: marcus_v1_indicator.pine, marcus_v1_screener.pine, marcus_v1_strategy.pine, plus Pro ORB v7 and v8 indicators and strategies, and comprehensive user manuals (MARCUS_V1_USER_MANUAL.md, COMMODUS_USER_MANUAL.md, INTELLIGENCE_LAYER_USER_MANUAL.md, PRO_ORB_V8_USER_MANUAL.md, EXECUTION_LAYER_UPDATE_PROMPT.md). This is the v1 foundation that Marcusv2 is rebuilding. The last commit removed the intelligence bridge from Pine Script and moved computation server-side.

## Tech Stack
- Language(s): Pine Script v6
- Framework(s): TradingView
- Database(s): None
- APIs/Services: TradingView (webhooks to execution layer)
- Deployment: TradingView (manual publish)

## Current State
- ✅ Built and working: v1 indicator, screener, strategy. Pro ORB v7/v8. Full user manuals documenting operation.
- 🔨 Scaffolded but incomplete: v1 is described as "Frankenstein code" in Marcusv2's CLAUDE.md
- 📋 Planned but not started: Superseded by v4.0 indicator in marcusv3/marcus-master-indicator

## Activity
- Last meaningful commit: 2026-02-15 — Removed intelligence bridge (Commodus now computes server-side, Pine Script is sensor only)
- Commits in last 30 days: 0
- Active branches: main, staging

## Open Issues / PRs
None

## Health Assessment
STALLING — Last commit was 2026-02-15. This is the legacy v1 codebase. The v4.0 Pine Script in marcusv3/marcus-master-indicator is the current indicator. This repo may still be referenced for its user manuals and Pro ORB work, but active development has moved on.

## Cross-Project Dependencies
- Depends on: TradingView, marcus-execution-layer (webhooks)
- Used by: marcus-execution-layer (v1 system)

## People Dependencies
T.J. only

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/marcus/ (v1 Pine Script)

## Questions for T.J.
1. Are the Pro ORB v7/v8 indicators separate products from MARCUS, or part of the same system?
2. Is v1 still published on TradingView and running, or has it been replaced by v4.0?
3. The user manuals here are comprehensive — are these still current, or have they been superseded by v2 docs?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-02-15, 0 commits in last 30 days — confirmed
- ✅ VERIFIED: Branches: main, staging — confirmed
- ✅ VERIFIED: This is the v1 Pine Script codebase — confirmed by cross-reference with marcus-execution-layer CLAUDE.md which describes "Pine Script v6 indicator (~3100 lines) + 3 private libraries"
- ❌ CORRECTED: "v1 is described as 'Frankenstein code' in Marcusv2's CLAUDE.md" → Actually it's the ARCHITECTURE doc (MARCUS_V2_ARCHITECTURE.md) that says this, not the CLAUDE.md directly. Minor but worth noting for sourcing accuracy.
- ❌ CORRECTED: Health assessment "STALLING" → Should note: v1 Pine Script indicator is likely STILL ACTIVE on TradingView sending webhooks to marcus-execution-layer, which is confirmed running live. "Stalling" in code doesn't mean inactive in production.
- ⚠️ LOW CONFIDENCE: Whether v1 or v4.0 Pine Script is currently active on TradingView — cannot determine from repo alone which is sending live webhooks to the v1 execution layer

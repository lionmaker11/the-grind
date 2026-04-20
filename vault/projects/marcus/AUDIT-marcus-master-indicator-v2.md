# marcus-master-indicator — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/marcus-master-indicator

## What This Is
Identical in purpose and structure to marcusv3 — a Pine Script v6 refactor of the Marcus v3.0.3 indicator decomposed into 13 named libraries. Files at the root level (not in a marcus-v4/ subfolder as in marcusv3). Contains the same 13 Pine Script libraries (MarcusUtils, MarcusSession, MarcusORB, MarcusICT, MarcusOTE, MarcusTargets, MarcusMode, MarcusPerf, MarcusConf, MarcusRisk, MarcusTrade, MarcusBridge, MarcusDash) plus main Marcus.pine. CLAUDE.md is at root (not in a subfolder). Does NOT feed Marcusv2.

## Tech Stack
- Languages: Pine Script v6
- Frameworks: TradingView (native platform)
- Databases: None
- External Services: TradingView only
- Deployment: TradingView

## Current State
- ✅ Working: All 13 library files exist, bug fixes applied (same types as marcusv3)
- 🔨 In progress: Active branch (claude/marcus-v4-refactor-ARSZY) — same refactor phase as marcusv3
- 📋 Planned: Same as marcusv3
- ❌ Not working / broken: No main branch

## Activity
- Last commit: 2026-03-12T17:59:42Z — fix(v4): apply all simplify review findings — blockers, warnings, dead code
- Commits in last 30 days: 2
- Active branches: claude/marcus-v4-refactor-ARSZY (only branch)

## Open Issues / PRs
None

## Health
STALLING — 2 commits in 30 days, last Mar 12. Very low activity. Appears to be duplicate/parallel to marcusv3 with uncertain distinction.

## Service Architecture
None — TradingView-only.

## External Dependencies
TradingView only.

## Cross-Project Links
- Parallel to marcusv3 (same codebase, same purpose — unclear distinction)
- Does NOT feed Marcusv2

## People
T.J.

## Questions for T.J.
1. Both marcusv3 and marcus-master-indicator have identical Pine Script v4 content. Which one is the "canonical" repo? Should one be archived?
2. What's the intended difference between these two repos?

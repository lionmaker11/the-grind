# marcus-master-indicator — Repo Audit
**Repo:** https://github.com/lionmaker11/marcus-master-indicator
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-12 — fix(v4): apply all simplify review findings — blockers, warnings, reuse, efficiency

## What This Is
marcus-master-indicator is another v4.0 Marcus Pine Script repo — very similar in structure to marcusv3. It contains CLAUDE.md, Marcus.pine (the v4.0 indicator), and a /libraries/ directory. Based on the commit messages, this appears to be a parallel track of the same v4.0 Pine Script refactor: one commit is "feat: Marcus v4.0 — Intelligence Architecture Upgrade" and another is "fix(v4): apply all simplify review findings." It's possible this was the "clean version" that resulted from the simplification review, with marcusv3 being the working branch.

## Tech Stack
- Language(s): Pine Script v6
- Framework(s): TradingView
- Database(s): None
- APIs/Services: TradingView (webhook alerts)
- Deployment: TradingView (manual publish)

## Current State
- ✅ Built and working: v4.0 Pine Script with Intelligence Architecture (Adaptive ORB + Sharpe/Omega), simplification review applied
- 🔨 Scaffolded but incomplete: Same deployment blocker as marcusv3 — requires manual TradingView username substitution and library publish
- 📋 Planned but not started: Unknown

## Activity
- Last meaningful commit: 2026-03-12 — Applied all simplify review findings (blockers, warnings, efficiency)
- Commits in last 30 days: 2
- Active branches: claude/marcus-v4-refactor-ARSZY (default branch — never merged to main)

## Open Issues / PRs
None

## Health Assessment
STALLING — 2 commits on 2026-03-12, nothing since. Same state as marcusv3 — appears to be a parallel refactor branch. The relationship between this repo and marcusv3 is unclear.

## Cross-Project Dependencies
- Depends on: TradingView, Marcusv2 (receives webhooks)
- Used by: Marcusv2 Signal Engine

## People Dependencies
T.J. only

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/marcus/

## Questions for T.J.
1. What is the difference between marcusv3 and marcus-master-indicator? They appear to contain the same v4.0 Pine Script — are they duplicates?
2. Which one is actually published on TradingView and sending webhooks?
3. Should one of these repos be archived to reduce confusion?
4. (NEW) Neither repo is sending webhooks to Marcusv2 — Marcusv2 has its own sensor. So what ARE these v4.0 repos for? Are they intended as an upgrade to the v1 system (marcus-execution-layer), or were they abandoned mid-refactor?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-12, 2 commits — confirmed
- ✅ VERIFIED: Single branch: claude/marcus-v4-refactor-ARSZY — confirmed
- ❌ CORRECTED: "Active branches: claude/marcus-v4-refactor-ARSZY (default branch — never merged to main)" → There IS NO main branch. The claude/ branch is the ONLY branch. Same pattern as marcusv3.
- ❌ CORRECTED: "Used by: Marcusv2 Signal Engine" → WRONG. Marcusv2 has its own sensor (pine/marcus_v2_sensor.pine). This v4.0 indicator does not feed Marcusv2.
- ⚠️ LOW CONFIDENCE: Relationship between marcusv3 and marcus-master-indicator — based on commit messages they appear parallel but distinct. Cannot confirm which (if either) is the "canonical" v4.0 indicator without reading the actual Pine Script content.

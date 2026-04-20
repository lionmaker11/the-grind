# Repo Watch — 2026-04-11 (Saturday)

## Active Today (last 24h)
- **Marcusv2**: 1 commit — `fix: unblock trading — lower confidence gates + fix institutional page (#370)`. Root cause: PR #356 raised confidenceMinEntry from 0→65, silently blocking all signal engine entries. Combined with MDD breaker fix (#368), Marcus hasn't traded since March 19 — 20 days. Fix lowers gate to 40. — `main`
- **tokenpolice**: 1 commit — `Fix sync-client pricing (was using old Opus $15/$75, now $5/$25)`. Agent commit (Claude Opus 4.6 co-author). — `main`
- **the-grind**: 1 commit — `grind: chief briefing 2026-04-10`. Automated daily data push. — `main`

## Silent (Active Projects)
- **MCDCommand**: 4.7 days — approaching 7-day threshold (not yet flagged)
- **Marcusv2**: ✅ Active (0.4 days)
- **agentsidehustle**: ✅ Active (1.4 days)

## ⏰ Classification Deadline Approaching
- **lionmaker-systems**: Created 2026-04-06, awaiting T.J. classification. Deadline: Apr 13 (T-2 days). Needs category assignment and active/paused designation.

## New Repos
- None

## Removed/Archived
- No changes (whop-saas-building and biggerspreadswaitlist remain archived — expected)

## Agent Work Detected
- **tokenpolice**: Claude Opus 4.6 co-authored commit (sync-client pricing fix)

## Notable
- **Marcusv2 PR #370 is critical**: Marcus has been unable to trade for 20 days due to confidence gate misconfiguration. This fix should unblock live trading. Monitor for trade activity today/tomorrow.
- Today is Saturday — no office day, lower activity expected.

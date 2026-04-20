# Repo Watch — 2026-04-09

## Active Today (last 24h)

### Marcusv2 — 1 commit
- **fix: disable MDD breaker enforcement — caused 18-day trading lockout (#368)** — lionmaker11
- The MDD (Max Daily Drawdown) breaker permanently blocked all trading since March 20. Death spiral: bad day triggered 8.88% MDD → block trades → no new trades → no new equity data → stale data keeps showing 8.88% forever. MDD enforcement disabled; other failsafes (daily loss circuit breaker, loss cooldown, kill switch, panic mode, max concurrent trades) remain active.
- ⚠️ **CRITICAL**: Marcus has been locked out of trading for 18 days due to this bug. Verify trading has resumed.

### agentsidehustle — 4 commits
- **fix: add token auth for git push in all workflow commit steps** — T.J
- **fix: add id-token:write permission to all workflows** — T.J
- **fix: remove invalid allowed_tools param from all GitHub Actions workflows** — T.J
- **chore: weekly trend research 2026-04-08 — all 3 niches** — Claude (agent commit)
- CI/CD pipeline fixes for GitHub Actions — token auth and OIDC permissions were broken. Claude agent ran weekly trend research.

### lionmaker-systems — 6 commits
- **Demo tabs: chat conversation + Listing Launch, dynamic timing** — T.J. Typinski
- **Remove 2 demo tabs: keep Midnight Lead, 60-Second BOV, Invoice** — T.J. Typinski
- **SEO engine v2: lionmaker.io domain, trending posts, GitHub Actions** — T.J. Typinski
- **Fix solution cards equal height** — T.J. Typinski
- **25 copy changes: broker repositioning, bio rewrite, card reduction** — T.J. Typinski
- **Add Automated BOV & Deal Underwriting across entire site** — T.J. Typinski
- Heavy push on the Lionmaker.io site — demo conversation UI, SEO engine, copy overhaul, BOV feature. All human commits.

### the-grind — 1 commit
- **grind: chief briefing 2026-04-08** — lionmaker11
- Daily Grind data push (normal/expected).

## Silent (Active Projects)
- **MCDCommand**: 2.7 days since last commit (Apr 6) — within normal range, no flag needed.
- **Marcusv2**: Active today ✅ (was approaching 7-day threshold yesterday)
- **agentsidehustle**: Active today ✅

## New Repos
- None

## Removed/Archived
- whop-saas-building — archived (known, already tracked)
- biggerspreadswaitlist — archived (known, already tracked)

## Agent Work Detected
- **agentsidehustle**: Claude agent commit — weekly trend research for all 3 DPE niches. Automated workflow.

## Open PRs
- None across active repos

## Flags for Morning Brief
- 🚨 **Marcus MDD Bug**: Marcusv2 had a critical MDD breaker bug that locked out ALL trading for 18 days (since March 20). Fix deployed today. T.J. should verify Marcus is actively trading again.
- 🔥 **lionmaker-systems hot streak**: 6 commits yesterday — T.J. is building fast on lionmaker.io. Still awaiting classification (due by Apr 13 per skill rules).

# Repo Watch — 2026-04-10

## Active Today (4 repos, 25 total commits)

### agentsidehustle — 4 commits (main)
- **fix: Whop products — correct pricing, add descriptions, create missing plans** (T.J.)
  - Prices were 100x too high ($1,900 instead of $19) — Whop uses dollars not cents
  - All 21 products got descriptions, 8 missing plans created, Discovery eligibility fixed
- **feat: Monitor tool architecture + workflow cost optimization** (T.J.)
- **chore: kill check run 2026-04-09** (Claude agent — automated daily check)
- Mix of human + agent commits. DPE sprint active.

### lionmaker-systems — 6 commits (main)
- **Demo animations wait for viewport visibility** — IntersectionObserver gating (Co-authored: Claude Opus 4.6)
- **Filter blog categories** to only show those with published posts
- **Trust section** full name + casual bio update
- **Blog CTAs** — mid-article + end-of-article calls to action
- **Calculator checkbox** UI fix — hide cost/hours subtitle
- **Demo fix** — fixed 420px terminal height, auto-scroll, 20s advance
- All authored by T.J. Typinski. Heavy polish session on the marketing site.

### tokenpolice — 1 commit (main)
- **Sprint 1: Fix critical pricing bug, visual polish, new insights & features** (T.J.)
  - Opus 4.6 pricing was 3x overestimate ($15/$75 → $5/$25)
  - Haiku pricing updated, cache write two-tier
  - HeroCard sparklines, ChartCard wrapper, premium styling
  - Auto-cleanup usage snapshots >7 days, static asset cache headers

### the-grind — 14 commits (main)
- 12x `results: 2026-04-09 sync` — automated Grind data syncs
- 1x `fix: normalize task fields` — task→text, project→project_name field rename + SW v14 bump
- Data repo, expected automated pattern.

## Silent (Active Projects)
- **MCDCommand**: 3.7 days since last commit (Apr 6) — within normal range, no flag yet
- **Marcusv2**: 1.4 days — healthy cadence

## Open PRs Needing Attention
- **Marcusv2 #369**: "fix: unblock trading — lower confidence gates + fix institutional page" by lionmaker11

## ⏰ Classification Deadline Approaching
- **lionmaker-systems**: Created Apr 6, awaiting T.J. classification. Deadline is Apr 13 (T-3 days). Currently seeing active development — 6 commits today, Next.js + Sanity marketing site for RE automation services. Needs formal classification into project cluster.

## New Repos
- None detected

## Removed/Archived
- No changes (whop-saas-building + biggerspreadswaitlist remain archived as expected)

## Agent Work Detected
- **agentsidehustle**: Claude agent ran daily kill check (automated maintenance commit)
- **lionmaker-systems**: Co-authored commit with Claude Opus 4.6 (demo animations feature)

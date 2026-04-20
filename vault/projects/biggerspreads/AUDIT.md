# biggerspreads — Repo Audit
**Repo:** https://github.com/lionmaker11/biggerspreads
**Audit Date:** 2026-04-03
**Last Commit:** 2025-12-29 — removed

## What This Is
BiggerSpreads is a SaaS product — a Next.js + Supabase (PostgreSQL) application with PLpgSQL migrations, a sanity-blog subfolder, and full Facebook Pixel + Stripe payment integration. Based on the IMPLEMENTATION_SUMMARY.md, it tracks CompleteRegistration and Purchase events (subscription + bundle), has an onboarding flow, Stripe webhooks, and a property detail feature (106-property-detail.json). The todo.txt says "Done till adding legal description in the details — need to update on supabase and add in storing function" — suggesting it's partially built.

## Tech Stack
- Language(s): TypeScript, JavaScript, CSS, PLpgSQL
- Framework(s): Next.js (App Router), Sanity v3 (blog), Drizzle or Supabase migrations
- Database(s): Supabase (PostgreSQL), with PLpgSQL migrations
- APIs/Services: Stripe (subscriptions + bundles), Facebook Pixel (ad conversion tracking), Stripe Webhooks
- Deployment: Vercel (inferred from Next.js + Sentry CVE fix PR)

## Current State
- ✅ Built and working: Facebook Pixel integration (client + server-side via Conversion API), Stripe webhook handler, onboarding page, property detail view, blog (Sanity)
- 🔨 Scaffolded but incomplete: Legal description field not yet added to Supabase schema or storing function (per todo.txt). "removed" commit on 12/29 suggests something was deleted or backed out.
- 📋 Planned but not started: ON HOLD per project context — T.J. is unsure if AI makes this obsolete. Decision point: June 2026.

## Activity
- Last meaningful commit: 2025-12-29 — "removed" (unclear what was removed)
- Commits in last 30 days: 0
- Active branches: main, thomasbranch, vercel/react-server-components-cve-vu-tvi729

## Open Issues / PRs
None open

## Health Assessment
ABANDONED (ON HOLD) — No commits in over 3 months. Deliberately paused per project context. The thomasbranch suggests at least one collaborator (Thomas?) was involved. The "removed" final commit is concerning — something was deliberately deleted before going quiet.

## Cross-Project Dependencies
- Depends on: Supabase (cloud database), Stripe, Facebook Pixel, Sanity (blog CMS), Vercel
- Used by: biggerspreadswaitlist (waitlist feeds into this)

## People Dependencies
Thomas (thomasbranch) — unclear who Thomas is

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/biggerspreads/

## Questions for T.J.
1. Who is Thomas (thomasbranch)? Is he a developer you hired?
2. What was "removed" in the 2025-12-29 commit? Was sensitive data committed and removed?
3. ~~Is the June 2026 decision point still the plan?~~ CONFIRMED (T.J., Apr 3). June 2026 is the evaluation point. T.J. did minor work on it Apr 2 but June timeline stands — not resuming full focus until then.
4. Is there a paying waitlist or user base that needs to be maintained/communicated with?
5. (NEW) The commit history shows "saving," "finalizing," "added analysis feature" — what is the "analysis feature" added on 12/21? This wasn't in the original audit context.
6. (NEW) The Vercel/react-server-components-cve branch suggests a Dependabot security alert was created — was the CVE actually fixed and the branch merged, or is it sitting open? If open, is the production site vulnerable?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2025-12-29 "removed" — confirmed
- ✅ VERIFIED: Branches: main, thomasbranch, vercel/react-server-components-cve-vu-tvi729 — confirmed
- ✅ VERIFIED: 0 commits in last 30 days — confirmed
- ⚠️ LOW CONFIDENCE: What "removed" actually removed — cannot determine from metadata alone. Could be sensitive keys, a feature, or debug code.
- ⚠️ LOW CONFIDENCE: Whether the CVE branch was merged or the site is still vulnerable — branch still exists, suggesting it may not have been merged

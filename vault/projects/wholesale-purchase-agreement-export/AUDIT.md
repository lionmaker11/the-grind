# wholesale-purchase-agreement-export — Repo Audit
**Repo:** https://github.com/lionmaker11/wholesale-purchase-agreement-export
**Audit Date:** 2026-04-03
**Last Commit:** 2025-10-30 — Initial commit: Whop-gated PDF exporter with template generator

## What This Is
A Whop-gated PDF exporter for wholesale real estate purchase agreements. It's a Next.js app using pdf-lib to generate PDF purchase agreement documents, with Whop platform integration for access gating (users must have a Whop membership to use the exporter). Built as a one-shot initial commit — the entire project was committed in two commits on the same day (initial create-next-app, then the full implementation).

## Tech Stack
- Language(s): TypeScript, JavaScript, CSS
- Framework(s): Next.js (App Router)
- Database(s): Supabase (referenced in todo.txt of biggerspreads — may share infra)
- APIs/Services: Whop (access gating), pdf-lib (PDF generation), zod (form validation)
- Deployment: Vercel (Next.js default)

## Current State
- ✅ Built and working: PDF exporter with Whop gating, template generator (per commit message)
- 🔨 Scaffolded but incomplete: todo.txt context suggests legal description field was still missing at time of last biggerspreads commit — may apply here too
- 📋 Planned but not started: Unknown — no follow-up commits after 2025-10-30

## Activity
- Last meaningful commit: 2025-10-30 — Initial full implementation (Whop-gated PDF exporter)
- Commits in last 30 days: 0
- Active branches: main only

## Open Issues / PRs
None

## Health Assessment
ABANDONED — Two commits on a single day in October 2025, nothing since. No updates in over 5 months. May have been a one-off build for a specific need.

## Cross-Project Dependencies
- Depends on: Whop platform (access gating), pdf-lib, Vercel
- Used by: Motor City Deals (presumed — for generating wholesale purchase agreements)

## People Dependencies
Unknown — possibly built for Ali or MCD use

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/motor-city-deals/ (real estate paperwork tool)

## Questions for T.J.
1. Is this tool live and being used by the MCD team to generate purchase agreements?
2. Is the Whop gating intentional (only Whop members can use it), or was that experimental?
3. Should this be integrated into MCDCommand's document generation feature instead of remaining separate?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2025-10-30 — confirmed (two commits: initial Create Next App, then full implementation)
- ✅ VERIFIED: Branch: main only — confirmed
- ✅ VERIFIED: 0 commits in last 30 days — confirmed
- ⚠️ LOW CONFIDENCE: The tech stack claim (Next.js, pdf-lib, Whop, zod) — not verified against package.json, inferred from commit message only. Should be verified.
- ⚠️ LOW CONFIDENCE: Whether this is deployed on Vercel and has ever been used for real MCD deals — no deployment evidence found

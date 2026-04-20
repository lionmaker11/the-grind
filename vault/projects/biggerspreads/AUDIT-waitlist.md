# biggerspreadswaitlist — Repo Audit
**Repo:** https://github.com/lionmaker11/biggerspreadswaitlist
**Audit Date:** 2026-04-03
**Last Commit:** 2025-09-11 — Update README.md / added google

## What This Is
biggerspreadswaitlist is the pre-launch waitlist site for BiggerSpreads SaaS. It's a Next.js app (create-next-app bootstrap) with a video component (commit: "video new"), Google integration (commit: "added google" — likely Google Analytics or Google Sheets for waitlist collection), and general fixes. The site was built in early September 2025 to capture email addresses for the BiggerSpreads launch.

## Tech Stack
- Language(s): TypeScript, JavaScript, CSS
- Framework(s): Next.js (App Router), Tailwind CSS
- Database(s): Unknown (likely Google Sheets or Supabase for waitlist emails)
- APIs/Services: Google (Analytics or Sheets), Vercel
- Deployment: Vercel

## Current State
- ✅ Built and working: Waitlist page with video, Google integration, and email capture (based on commits)
- 🔨 Scaffolded but incomplete: Standard create-next-app README — no custom documentation
- 📋 Planned but not started: Integration with main BiggerSpreads app (on hold with the main app)

## Activity
- Last meaningful commit: 2025-09-11 — "added google" (Google tracking/integration)
- Commits in last 30 days: 0
- Active branches: main only

## Open Issues / PRs
None

## Health Assessment
ABANDONED — No commits since September 2025. The main BiggerSpreads project is on hold until June 2026, so this is frozen alongside it.

## Cross-Project Dependencies
- Depends on: Google (Analytics/Sheets), Vercel, biggerspreads (main app)
- Used by: Nothing — this feeds into biggerspreads

## People Dependencies
Unknown

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/biggerspreads/

## Questions for T.J.
1. How many emails are on the BiggerSpreads waitlist?
2. Is the waitlist site still live and collecting emails, or has it been taken down?
3. When BiggerSpreads resumes in June 2026, is there a plan to communicate with the waitlist?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2025-09-11 — confirmed
- ✅ VERIFIED: Branch: main only — confirmed
- ✅ VERIFIED: 0 commits in last 30 days — confirmed
- ❌ CORRECTED: "Last Commit: 2025-09-11 — Update README.md / added google" → The actual last commit message is "Update README.md" (not a combined message). "added google" was the commit immediately before it, both on the same day. Minor phrasing issue but technically inaccurate.
- ⚠️ LOW CONFIDENCE: Whether "added google" means Google Analytics, Google Sheets for collection, or something else — cannot determine from commit message alone

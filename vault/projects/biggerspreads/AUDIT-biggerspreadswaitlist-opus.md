# biggerspreadswaitlist — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/biggerspreadswaitlist

## What This Is
A waitlist/coming-soon landing page for BiggerSpreads. Next.js app with Supabase for waitlist data storage, Mailchimp for email capture/marketing, Mux for video playback, and rich animations (Framer Motion, GSAP). Serves as the pre-launch capture page before the main BiggerSpreads platform launches. Package name in package.json: "coming-soon-bigger-spreads".

## Tech Stack
Languages: TypeScript
Frameworks: Next.js (with Turbopack), Tailwind CSS, Radix UI, Framer Motion, GSAP
Databases: Supabase (waitlist storage)
External Services (from package.json dependencies — no .env.example found):
  - Supabase: waitlist data (@supabase/ssr, @supabase/supabase-js)
  - Mailchimp: email marketing list (@mailchimp/mailchimp_marketing)
  - Mux: video hosting/playback (@mux/mux-player-react)
Deployment: Vercel (per Next.js project structure)

## Current State
✅ Working: Waitlist page deployed (assumed — was live as capture mechanism)
❌ Broken/placeholder: Stale since September 2025 — 7 months of no updates

## Activity
Last commit: 2025-09-11 — Update README.md
Commits (30d): 0
Branches: main

## Open Issues / PRs
None

## Health
ABANDONED — Last commit September 2025, ~7 months ago. BiggerSpreads is on hold until June 2026. This waitlist page may still be live capturing emails but the codebase is frozen.

## External Services (verified from package.json — no .env.example)
- Supabase: waitlist email storage
- Mailchimp: email list management
- Mux: video content

NOTE: No .env.example found. Service list from package.json only — less than 90% confident all services are captured.

## Cross-Project Links
- biggerspreads: main platform this waitlist feeds into

## Questions for T.J.
1. Is biggerspreadswaitlist still live collecting emails? If so, how many waitlist signups do you have going into the June launch?

# biggerspreads — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/biggerspreads

## What This Is
A real estate investor SaaS platform — BiggerSpreads. Full-stack Next.js app in the nextjs/ subdirectory, with a separate Sanity blog in sanity-blog/. Features include: property deal analysis tools, Facebook Pixel tracking (conversion events for Paddle subscriptions), a blog, Mailchimp email integration, Mux video player, Supabase auth/database. Paddle (not Stripe) for subscription billing. Facebook Conversion API for server-side purchase event tracking. Significant UI framework (Radix UI, DnD Kit, Framer Motion, GSAP animations).

CONFIRMED: ON HOLD until June 2026.

## Tech Stack
Languages: TypeScript
Frameworks: Next.js, Tailwind CSS, Radix UI, Framer Motion, GSAP
Databases: Supabase (PostgreSQL + auth)
External Services (from nextjs/.env.template referenced in IMPLEMENTATION_SUMMARY.md — no .env.example found at root or nextjs/):
  - Supabase: auth + database (@supabase/ssr, @supabase/supabase-js in package.json)
  - Paddle: subscription billing (@paddle/paddle-js, @paddle/paddle-node-sdk in package.json)
  - Mailchimp: email marketing (@mailchimp/mailchimp_marketing in package.json)
  - Mux: video hosting (@mux/mux-player-react in package.json)
  - Facebook Pixel + Conversion API: ad tracking (NEXT_PUBLIC_FACEBOOK_PIXEL_ID: 1058694122953478, FACEBOOK_CONVERSION_API_TOKEN per IMPLEMENTATION_SUMMARY.md)
  - Sanity CMS: blog content (sanity-blog/ subdirectory)
Deployment: Vercel (per Next.js project structure — no Procfile or railway.json)

## Current State
✅ Working:
  - Facebook Pixel + Conversion API integration complete (per IMPLEMENTATION_SUMMARY.md)
  - Onboarding flow (CompleteRegistration tracking)
  - Paddle webhook → server-side Purchase event tracking
  - Blog setup (BLOG_SETUP.md present)

🔨 In progress:
  - ON HOLD until June 2026 (confirmed)

📋 Planned:
  - Full platform launch (June 2026 target)

❌ Broken/placeholder:
  - No .env.example at root or nextjs/ — configuration not documented in repo
  - thomasbranch open (Thomas is a known person — not flagged as unknown per confirmed facts)

## Activity
Last commit: 2025-12-29 — removed
Commits (30d): 0
Branches: main, thomasbranch, vercel/react-server-components-cve-vu-tvi729

## Open Issues / PRs
None

## Health
ABANDONED (on hold) — Last commit December 2025, ~3 months ago. CONFIRMED ON HOLD until June 2026. The vercel CVE branch (react-server-components security fix) was auto-created by Vercel and not merged.

## External Services (verified from package.json dependencies only — no .env.example found)
- Supabase: auth + database
- Paddle: subscription billing
- Mailchimp: email marketing
- Mux: video hosting
- Facebook Pixel + Conversion API: ad conversion tracking (pixel ID: 1058694122953478 per implementation docs)
- Sanity: blog CMS

NOTE: No .env.example exists in this repo. Service list derived from package.json imports — less than 90% confident all services are captured.

## Cross-Project Links
- biggerspreadswaitlist: waitlist capture page, active before main platform launch
- wholesale-purchase-agreement-export: related MCD tool (Whop-gated PDF generator)

## Questions for T.J.
1. The vercel/react-server-components-cve-vu-tvi729 branch is unmerged. Is this a real CVE that needs to be merged before June relaunch?
2. Is thomasbranch still active, or should it be merged/closed before the June sprint?

# biggerspreads — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/biggerspreads

## What This Is
The BiggerSpreads real estate deal analysis and wholesaling SaaS platform. Full Next.js app under nextjs/ subdirectory. Has a blog, property detail analysis, onboarding flow, deal analysis pages, and marketing content. Uses Paddle for payments (not Stripe), Supabase for database/auth, Mailchimp for email marketing, Mux for video content, Facebook Pixel for ad tracking. ON HOLD until June 2026 evaluation (confirmed by T.J.).

## Tech Stack
- Languages: TypeScript
- Frameworks: Next.js 15.5 (nextjs/ directory), Tailwind CSS v4, Radix UI components, Framer Motion, GSAP (animations)
- Databases: Supabase (PostgreSQL + auth)
- External Services (from nextjs/package.json + IMPLEMENTATION_SUMMARY.md):
  - Paddle (paddle-node-sdk, paddle-js) — subscription payments
  - Supabase (@supabase/supabase-js, @supabase/ssr) — database + auth
  - Mailchimp (@mailchimp/mailchimp_marketing) — email list management
  - Mux (@mux/mux-player-react) — video hosting/playback
  - Facebook Pixel — ad conversion tracking (implemented per IMPLEMENTATION_SUMMARY.md, server-side via Stripe/Paddle webhook)
- Deployment: Vercel (inferred from Next.js + no deployment config in repo)

## Current State
- ✅ Working: Next.js app structure, blog system, property detail analysis UI, onboarding flow, Facebook Pixel integration, Paddle webhook for purchase tracking, Mailchimp integration, Mux video player
- 🔨 In progress: Nothing — development paused
- 📋 Planned: Full SaaS launch post-June 2026 evaluation
- ❌ Not working / broken: Open PR "thomasbranch" from PR #2 (still OPEN since Nov 2025 — who is Thomas?)

## Activity
- Last commit: 2025-12-29T20:41:56Z — removed
- Commits in last 30 days: 0 (as of Apr 3 2026)
- Active branches: main, thomasbranch, vercel/react-server-components-cve-vu-tvi729

## Open Issues / PRs
- PR #2: thomasbranch — OPEN since 2025-11-22 — from thomasbranch to main

## Health
ON HOLD — 0 commits in 30 days. Last commit Dec 2025 (94+ days ago). T.J. confirmed this project is on hold until June 2026 evaluation. Not abandoned — intentionally paused.

## Service Architecture
Vercel deployment (1 service — Next.js app).

## External Dependencies
- Paddle: Subscription payments (replaces Stripe — not using Stripe)
- Supabase: Database + auth
- Mailchimp: Email list management
- Mux: Video hosting/playback
- Facebook Pixel: Ad conversion tracking

## Cross-Project Links
- biggerspreadswaitlist: Related waitlist landing page (separate repo)
- MCDCommand: Shares MAO calculator formula (documented in MCDCommand CLAUDE.md)

## People
T.J. + someone named Thomas (thomasbranch PR open since Nov 2025 — contributor?).

## Questions for T.J.
1. Who is Thomas? (PR #2 "thomasbranch" open since Nov 2025 — contributor or test account?)
2. June 2026 evaluation — what are the go/no-go criteria?
3. Is the BiggerSpreads site live at biggerspreads.com or similar URL, or is it purely in development?

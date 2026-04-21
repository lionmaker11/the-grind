# trishpaintsjoy — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/trishpaintsjoy

## What This Is
Art gallery and e-commerce website for Trish (T.J.'s wife), an artist. Site at trishpaintsjoy.com. Features a gallery of paintings (alpacas, Detroit themes, pet portraits, custom commissions), a journal/blog, contact form, and newsletter signup. Uses Sanity CMS for content management, Snipcart for shopping cart/payments, and Resend for contact form emails.

## Tech Stack
- Languages: TypeScript
- Frameworks: Next.js (next.config.ts present), Tailwind CSS (postcss.config.mjs present), Sanity CMS
- Databases: Sanity (headless CMS, cloud)
- External Services (from .env.example):
  - Sanity — CMS for artwork/journal content (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN)
  - Snipcart — Shopping cart and payment processing (NEXT_PUBLIC_SNIPCART_API_KEY)
  - Resend — Contact form email delivery (RESEND_API_KEY)
- Deployment: Vercel (inferred from "Remove vercel.json — framework set in project settings" commit message)

## Current State
- ✅ Working: Gallery with real artwork images (alpacas, Detroit subjects, pet portraits, commissions), journal/blog system, contact form, newsletter signup, About page, Commission page
- 🔨 In progress: Unknown — last commits were removing vercel.json (deployment config cleanup)
- 📋 Planned: Unknown
- ❌ Not working / broken: Cannot determine from code — live status unknown

## Activity
- Last commit: 2026-03-29T23:01:30Z — Remove vercel.json — framework set in project settings
- Commits in last 30 days: 6
- Active branches: main

## Open Issues / PRs
None

## Health
STALLING — 6 commits in 30 days, last commit Mar 29. Low activity suggests site is largely built and may be live. Could be in maintenance mode.

## Service Architecture
Vercel deployment (1 service — Next.js app on Vercel edge).

## External Dependencies
- Sanity: Content management for artwork, journal posts (NEXT_PUBLIC_SANITY_PROJECT_ID required)
- Snipcart: Shopping cart and payment processing for artwork sales
- Resend: Contact form email delivery

## Cross-Project Links
None.

## People
T.J. built it for Trish (wife). Trish manages the content via Sanity CMS.

## Questions for T.J.
1. Is trishpaintsjoy.com live and accepting orders? (Cannot determine from code — live status unknown)
2. Has Snipcart been configured with real payment credentials? Are sales going through?
3. Is Sanity content fully populated with Trish's artwork catalog?

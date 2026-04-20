# trishpaintsjoy — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/trishpaintsjoy

## What This Is
Artist portfolio and e-commerce website for Trish (friend of T.J.'s dad). Next.js site with Sanity CMS for artwork content management, Snipcart for e-commerce checkout, and Resend for contact form email. Built as a personal favor — not a business venture.

## Tech Stack
Languages: TypeScript
Frameworks: Next.js (latest per package.json), Tailwind CSS
Databases: Sanity (headless CMS — hosted)
External Services (from .env.example):
  - Sanity CMS: content management (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN)
  - Snipcart: e-commerce / shopping cart (NEXT_PUBLIC_SNIPCART_API_KEY)
  - Resend: contact form email (RESEND_API_KEY)
Deployment: Vercel (per repo structure — no Procfile or railway config)
  - Site URL: https://trishpaintsjoy.com (per .env.example)

## Current State
✅ Working:
  - Site built and deployed to trishpaintsjoy.com
  - Artwork gallery with real images (jpg, webp, png in public/images/)
  - E-commerce via Snipcart

🔨 In progress:
  - None apparent

📋 Planned:
  - None documented

❌ Broken/placeholder:
  - AGENTS.md is the only content of CLAUDE.md (just a reference tag — minimal Claude instructions)

## Activity
Last commit: 2026-03-29 — Remove vercel.json — framework set in project settings
Commits (30d): 6
Branches: main

## Open Issues / PRs
None

## Health
STALLING — 6 commits in 30 days (all likely final polish before launch). Site appears live at trishpaintsjoy.com. No active development tasks needed per confirmed facts. Built as a favor — maintenance cadence will be minimal.

## External Services (verified from .env.example)
- Sanity CMS: artwork content management (project ID: your_project_id per template)
- Snipcart: shopping cart and checkout
- Resend: contact form email delivery

## Cross-Project Links
None.

## Questions for T.J.
1. Is trishpaintsjoy.com live and Trish happy with it? Anything outstanding before you close this out?

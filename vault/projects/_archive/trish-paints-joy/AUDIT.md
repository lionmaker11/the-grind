# trishpaintsjoy — Repo Audit
**Repo:** https://github.com/lionmaker11/trishpaintsjoy
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-29 — Remove vercel.json — framework set in project settings

## What This Is
Trishpaintsjoy is a professional artist portfolio and e-commerce website for trishpaintsjoy.com. It's a Next.js 15 site with Sanity v3 as the headless CMS (for managing artwork, blog posts, events, and shop products), and Snipcart for e-commerce (cart overlay for selling paintings). It includes pages for gallery, shop, journal/blog, about, events, Instagram feed, and a contact/newsletter section. Built in a single day on 2026-03-29 with dark mode and full mobile responsiveness.

## Tech Stack
- Language(s): TypeScript, JavaScript, CSS
- Framework(s): Next.js 15 (App Router), Tailwind CSS v4
- Database(s): Sanity v3 (headless CMS, cloud-hosted)
- APIs/Services: Sanity (content), Snipcart (e-commerce), Resend (contact form emails), Instagram (feed display)
- Deployment: Vercel

## Current State
- ✅ Built and working: Full site built — homepage, gallery with filters, shop with Snipcart cart, journal/blog, about page, events section, Instagram feed, contact form, newsletter, dark mode, mobile responsive. Sanity Studio embedded at /studio.
- 🔨 Scaffolded but incomplete: Sanity project ID uses a fallback (not the real production ID based on commit message "Fix Sanity project ID fallback for Vercel build") — content may not be fully connected. Snipcart configured with placeholder API key in .env.example.
- 📋 Planned but not started: No explicit roadmap found.

## Activity
- Last meaningful commit: 2026-03-29 — Removed vercel.json (framework auto-detected by Vercel project settings)
- Commits in last 30 days: 6
- Active branches: main only

## Open Issues / PRs
None

## Health Assessment
STALLING — Built in a single burst on 2026-03-29. All 6 commits are from that one day. No activity since. The site structure is complete but it's unclear if it's live with real content populated in Sanity or if Trish has been given CMS access to manage her artwork.

## Cross-Project Dependencies
- Depends on: Sanity project (cloud CMS), Snipcart account, Resend account, Vercel deployment
- Used by: Nothing

## People Dependencies
Trish (presumably a family member or client). The site is for her art business — she would need to populate Sanity with artwork, prices, and blog content.

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/trish-paints-joy/

## Questions for T.J.
1. Who is Trish? Is this a family member, client, or personal project?
2. Is the site live at trishpaintsjoy.com with real content, or still waiting for Sanity content to be populated?
3. Has Trish been given Sanity Studio access to manage her own content?
4. Is the Snipcart account set up with real products, or still placeholder?
5. (NEW) Has the Sanity project ID been configured in Vercel environment variables (even if not in the repo .env)? Without a real project ID, no CMS content loads.
6. (NEW) The repo has actual artwork images (alpacas, Michigan paintings, etc.) committed to public/images/ — are these placeholder stock images or actual Trish's work?
7. (NEW) An InstagramGrid.tsx component exists — has the Instagram feed been connected to a real @trishpaintsjoy (or similar) account? Instagram API requires an access token.
8. (NEW) There is a RESEND_API_KEY placeholder in .env.example — has the Resend domain/API been configured for contact form emails to go through?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-29 — confirmed
- ✅ VERIFIED: 6 commits all on 2026-03-29 — confirmed
- ✅ VERIFIED: Branch: main only — confirmed
- ✅ VERIFIED: Sanity v3 CMS integration — confirmed via package.json and multiple sanity/ directories
- ✅ VERIFIED: Snipcart integration — confirmed via SnipcartButton.tsx component (CDN-based, not npm)
- ✅ VERIFIED: Instagram grid component — confirmed via InstagramGrid.tsx (CDN/API-based, not npm package)
- ✅ VERIFIED: Resend contact form API route — confirmed via src/app/api/contact/route.ts
- ❌ CORRECTED: "Next.js 15 (App Router)" → Actually Next.js 16.2.1 per package.json
- ❌ CORRECTED: Sanity project ID is placeholder ("your_project_id") in .env.example — content cannot be loading in production without a real project ID configured somewhere (likely Vercel env vars)
- ⚠️ LOW CONFIDENCE: Whether the site is actually live at trishpaintsjoy.com with real content — Sanity project ID and Snipcart API key are both placeholders in the repo
- ⚠️ LOW CONFIDENCE: Whether artwork images in public/images/ are actual Trish's artwork or stock images used as placeholders

# wholesale-purchase-agreement-export — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/wholesale-purchase-agreement-export

## What This Is
A Next.js app that generates Wholesale Purchase Agreement PDFs, gated behind Whop.com entitlement verification. User fills in form fields (buyer name, seller name, property address, purchase price, earnest money, closing date, etc.), app verifies Whop entitlement via API token, then generates a PDF using a template file and pdf-lib. Has a Supabase migration for an "agreements" table (Oct 2025) and a make-template.ts script.

## Tech Stack
- Languages: TypeScript
- Frameworks: Next.js 16.0.1 (App Router)
- Databases: Supabase (migration exists but may not be active — lib/whop.ts is the primary gating)
- External Services (from app/api/generate/route.ts):
  - Whop.com — entitlement verification (bearer token from request header)
  - pdf-lib ^1.17.1 — PDF generation
- Deployment: Unknown (standard Next.js — likely Vercel)

## Current State
- ✅ Working: PDF generation endpoint exists, Whop entitlement check implemented, PDF template loading with fallback
- 🔨 In progress: Nothing visible
- 📋 Planned: Nothing visible
- ❌ Not working / broken: Repository has been inactive since Oct 2025. No README updated. No Whop API key visible in any config.

## Activity
- Last commit: 2025-10-30T16:55:00Z — Initial commit: Whop-gated PDF exporter with template generation
- Commits in last 30 days: 0
- Active branches: Unknown

## Open Issues / PRs
None

## Health
STALLING/ABANDONED — Single initial commit Oct 2025. No subsequent development. 5+ months inactive.

## Service Architecture
Unknown — likely Vercel (Next.js app).

## External Dependencies
- Whop.com: Entitlement verification (content gating)
- pdf-lib: PDF generation

## Cross-Project Links
- MCDCommand has built-in document generation (purchase agreement, assignment of contract) via document-generator.ts — this standalone tool may be redundant

## People
T.J.

## Questions for T.J.
1. Is this tool live on Whop.com? Is it generating revenue?
2. MCDCommand already has built-in purchase agreement generation. Is this a standalone product sold separately on Whop, or a deprecated tool?
3. Should this be archived?

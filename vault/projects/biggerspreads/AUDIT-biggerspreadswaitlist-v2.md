# biggerspreadswaitlist — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/biggerspreadswaitlist

## What This Is
A waitlist landing page for BiggerSpreads. Next.js app with a single subscribe form. On submission, adds email to Supabase (waitlist table), sends a confirmation email via Resend, and adds subscriber to Mailchimp list. Has a thank-you page at /thankyou. Minimal footprint — just the waitlist collection mechanism.

## Tech Stack
- Languages: TypeScript
- Frameworks: Next.js 15.5 (App Router), Tailwind CSS v4
- Databases: Supabase (@supabase/supabase-js ^2.56.0, @supabase/ssr ^0.7.0)
- External Services (from src/app/api/subscribe/route.ts):
  - Supabase — waitlist email storage
  - Resend — confirmation email (RESEND_API_KEY)
  - Mailchimp (@mailchimp/mailchimp_marketing ^3.0.80) — list subscriber addition
- Deployment: Vercel (inferred from Next.js)

## Current State
- ✅ Working: Waitlist form, Supabase insert, Resend confirmation email, Mailchimp list add
- ❌ Not working / unknown: How many emails are collected? Not visible from code.

## Activity
- Last commit: 2025-09-11T19:31:22Z — Update README.md
- Commits in last 30 days: 0
- Active branches: main

## Open Issues / PRs
None

## Health
ABANDONED — Last commit Sep 2025 (7+ months ago). The associated BiggerSpreads project is on hold until June 2026. This waitlist may be live collecting emails in the background.

## Service Architecture
Vercel (1 service — Next.js app).

## External Dependencies
- Supabase: Email storage
- Resend: Confirmation emails
- Mailchimp: List management

## Cross-Project Links
- biggerspreads: The main platform this waitlist is for

## People
T.J.

## Questions for T.J.
1. Is this waitlist page live? How many emails have been collected?
2. Is the Mailchimp list being nurtured with content while BiggerSpreads is on hold?

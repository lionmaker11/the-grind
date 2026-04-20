# MCDCommand — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/MCDCommand

## What This Is
Full-stack Next.js 14 real estate wholesaling command center for Motor City Deals (Detroit metro). Handles seller/agent outreach (SMS via Twilio, email via Resend), AI conversation management, deal pipeline (acquisition through disposition), buyer blasts, and property underwriting. 22-table Prisma schema, 6 AI agents (Roman/GM, Mira/Acquisition, Cole/Disposition, Nix/DataOps, Sage/Intelligence, Vigil/Sentinel). Has multi-tenant GrillaHQ scaffold in a feature branch but is single-tenant in production. Built for T.J.'s personal wholesaling operation.

## Tech Stack
- Languages: TypeScript (strict mode)
- Frameworks: Next.js 14 (App Router), React 18, Tailwind CSS, React Email, Playwright (e2e)
- Databases: PostgreSQL via Prisma ORM (22 tables), Redis via ioredis (BullMQ jobs)
- External Services (from .env.example):
  - Twilio — SMS via Messaging Service SID. .env.example says "A2P 10DLC approved" but T.J. confirmed 10DLC IS STILL PENDING (switched to new account/number)
  - Resend — Email (motorcitydeals.com domain)
  - Anthropic (Claude API) — AI conversations + underwriting (Haiku for volume, Sonnet for quality)
  - BatchData — Skip tracing + DNC checking. RESTRICTED: only DNC check (~$0.02/call) and skip-trace (~$0.15-0.50/call) endpoints approved. Property Search ($8+/call) BANNED.
  - Google Maps/Street View — Property photos
  - Cloudflare R2 — Object/photo storage
  - Sentry — Error monitoring (DSN present but empty in .env.example)
- Deployment (from Procfile — verified):
  - web: npm start (Next.js app)
  - messaging: npm run worker:messaging (BullMQ)
  - scraper: npm run worker:scraper (BullMQ)
  - underwriting: npm run worker:underwriting (BullMQ)
  - Total Railway services: 4 app processes + PostgreSQL plugin + Redis plugin = 6 services
  - NOTE: CLAUDE.md says "12 services" — THIS IS WRONG. Procfile has 4, docker-compose (local only) has postgres+redis. Actual Railway count = 6.

## Current State
- ✅ Working: Full Next.js app with 200+ API routes, Kanban pipeline board, CSV import, deal management, AI conversation system, email campaigns, template system, DNC guard, opt-out detection, lead scoring, MAO calculator, weekly briefing, onboarding wizard, multi-org scaffold (GrillaHQ tables in schema), document generation (purchase agreement, assignment of contract), A/B testing engine, drip sequences, enrichment via BatchData, Google Street View photos, rehab rate cron, score recalibration
- 🔨 In progress: GrillaHQ multi-tenant (branch exists: feat/grillahq-multi-tenant — schema migrated but not the focus per T.J.), Shadcn UI overhaul (branch: feat/shadcn-ui-overhaul), template generator v2
- 📋 Planned: Stripe integration (commented out in .env.example — "Phase 5 placeholder" — T.J. confirmed NOT needed)
- ❌ Not working / broken: Vigil (Sentinel) agent — CLAUDE.md explicitly says "UNIMPLEMENTED — registry entry only. Compliance is ad-hoc via dnc-guard, opt-out-detector, comms-rules, banned-phrases"

## Activity
- Last commit: 2026-04-03T03:31:03Z — cleanup: 5-phase audit remediation + CLAUDE.md guardrails installation
- Commits in last 30 days: 218 (verified via pagination: 100+100+18)
- Active branches: deploy-config, feat/grillahq-multi-tenant, feat/onboarding-wizards, feat/shadcn-ui-overhaul, feat/template-generator-v2, feat/unified-agent-identity, main, mao-calculator-update, scraped-leads-ui, scraper-tuning, stage-1-foundation, stage-2-pipeline-kanban, stage-6-polish

## Open Issues / PRs
None visible (issues disabled or private)

## Health
ACTIVE — Most active repo in the account. 100+ commits in 30 days as of Apr 3. Core wholesaling system actively being built and maintained.

## Service Architecture
Railway deployment (from Procfile):
1. web — Next.js full-stack app (API routes + frontend)
2. messaging — BullMQ worker for SMS/email sending
3. scraper — BullMQ worker for Wayne County scraping (code violations, foreclosure, probate, tax delinquent)
4. underwriting — BullMQ worker for deal underwriting
5. PostgreSQL — Railway managed plugin
6. Redis — Railway managed plugin

## External Dependencies
- Twilio: SMS outbound/inbound via Messaging Service. 10DLC STILL PENDING (switched to new Twilio account — old "approved" comment in .env.example is stale)
- Resend: Email delivery (motorcitydeals.com). Inbound reply webhook at /api/webhooks/resend
- Anthropic Claude API: AI conversation responses + deal underwriting. Haiku for volume, Sonnet for quality
- BatchData: Skip tracing (approved), DNC checking (approved). Several endpoints BANNED due to cost ($8+/call)
- Google Maps/Street View: Property photo retrieval
- Cloudflare R2: Object storage for property photos
- Sentry: Error monitoring (@sentry/nextjs in package.json, DSN in .env.example but empty)
- Apollo.io: NOT an actual dependency. Appears only in tests/mocks/apollo.ts as a Jest mock — not in package.json, not imported in source code

## Cross-Project Links
- mcd-agent-org: Separate Python agent layer that calls MCDCommand's API (MCD_API_URL in mcd-agent-org .env.example)
- mls-bot: Earlier standalone MLS outreach bot, likely superseded by MCDCommand's acquisition pipeline
- purchase-agreement-exporter / wholesale-purchase-agreement-export: Standalone PDF tools that duplicate MCDCommand's built-in document generation

## People
T.J. — builder and operator. Single-tenant operation (T.J.'s own wholesaling business).

## Questions for T.J.
1. CLAUDE.md says "12 services" but Procfile shows 4 app processes + 2 managed (postgres/redis) = 6. Are there additional Railway services not in the Procfile (e.g., a separate cron worker, a Telegram notification service, or something else)?
2. The 10DLC .env.example comment says "approved" — confirming this is stale from old Twilio account. New account 10DLC registration: what's the current status (brand created? campaign submitted? awaiting approval?)?
3. The Vigil/Sentinel compliance agent is explicitly "UNIMPLEMENTED — registry entry only" per CLAUDE.md. Is this intentional for now, or is it a gap that needs addressing?
4. The mcd-agent-org Python agent layer (6 agents in docker-compose) — is this actually running alongside MCDCommand, or was it an experiment that was abandoned in favor of the built-in AI agents?

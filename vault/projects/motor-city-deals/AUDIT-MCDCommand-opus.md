# MCDCommand — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/MCDCommand

## What This Is
Full-stack real estate wholesaling command center for Motor City Deals (Detroit metro). Next.js 14 app with a 6-agent AI organization (Roman/GM, Mira/Acquisition, Cole/Disposition, Nix/DataOps, Sage/Intelligence, Vigil/Sentinel). Handles seller + buyer outreach, AI-powered conversations, deal pipeline, document generation, MLS scraping, lead scoring, and weekly briefings. 22-table Prisma schema. BullMQ workers for async messaging, scraping, and underwriting.

## Tech Stack
Languages: TypeScript (strict), SQL (Prisma migrations)
Frameworks: Next.js 14 (App Router), React, Tailwind CSS, React Email, BullMQ
Databases: PostgreSQL (Prisma ORM), Redis (BullMQ queues)
External Services (from .env.example):
  - Twilio: SMS outreach (Messaging Service SID referenced in CLAUDE.md: MG595789fe242860a7304402fdbcc51421)
  - Resend (domain: motorcitydeals.com): Transactional email
  - Anthropic (Claude): AI conversations + underwriting (Haiku for volume, Sonnet for quality)
  - BatchData (https://api.batchdata.com/api/v1): Skip tracing + DNC checking — RESTRICTED endpoints only
  - Google Maps API: Street View property photos
  - Cloudflare R2: Object storage (property photos)
  - Sentry: Error monitoring (DSN blank in .env.example — not yet configured)
Deployment (from Procfile — 4 processes):
  - web: npm start
  - messaging: npm run worker:messaging
  - scraper: npm run worker:scraper
  - underwriting: npm run worker:underwriting

Note: CLAUDE.md states "12 services" on Railway. Procfile verifies only 4 application process types. Additional Railway services (PostgreSQL, Redis, etc.) are infrastructure-level and not enumerable from repo files. T.J.'s estimate of ~7 is plausible if counting app services + databases + Redis.

## Current State
✅ Working:
  - Full acquisition + disposition pipeline (Kanban board, deal stages)
  - AI-powered SMS + email outreach (Mira/Cole agents)
  - Lead scoring, calibration, weekly briefings
  - BatchData skip tracing and DNC checking
  - A2P/10DLC onboarding wizard (status poll + manual check wired)
  - 469+ tests passing (unit, integration, E2E)
  - Document generation (purchase agreement, assignment of contract)
  - Multi-tenant schema (schema migrations through 20260402)
  - GrillaHQ multi-tenant migration exists in schema (20260322) but single-tenant MCD deployment only

🔨 In progress:
  - A2P 10DLC registration (confirmed pending — new Twilio account + number)
  - Audit remediation (AUDIT.md forensic findings, C-01 through C-07)
  - Ongoing active development (today's commit: cleanup + CLAUDE.md guardrails)

📋 Planned:
  - Pipeline add/edit columns (config-driven stage management UI)
  - Vigil agent (Sentinel) — currently PHANTOM, zero implementation

❌ Broken/placeholder:
  - Vigil (Sentinel) agent: registered in constants.ts with zero code, zero skills, zero server logic
  - C-07 LIVE BUG (from AUDIT.md): `/api/agents/activity` returns `{ activity: [] }` but `agents/page.tsx` reads `data.activities` — UI agent activity panel broken
  - Stripe: commented out in .env.example, placeholder complete only
  - Sentry DSN: blank — error monitoring not collecting

## Activity
Last commit: 2026-04-03T03:31:03Z — cleanup: 5-phase audit remediation + CLAUDE.md guardrails installation
Commits (30d): 218 (pages 1+2+3: 100+100+18)
Branches: deploy-config, feat/grillahq-multi-tenant, feat/onboarding-wizards, feat/shadcn-ui-overhaul, feat/template-generator-v2, feat/unified-agent-identity, main, mao-calculator-update, scraped-leads-ui, scraper-tuning, stage-1-foundation, stage-2-pipeline-kanban, stage-6-polish (13 total)

## Open Issues / PRs
None

## Health
ACTIVE — This is the primary product under active daily development with 218 commits in 30 days. A forensic audit was just completed (AUDIT.md, 2026-04-02) identifying several architectural inconsistencies. Today's commit addressed scaffolding residue and installed guardrails.

## External Services (verified from .env.example)
- Twilio: SMS outreach (A2P 10DLC — pending registration)
- Resend: Email (motorcitydeals.com domain)
- Anthropic/Claude: AI seller/buyer conversations + underwriting
- BatchData: Skip tracing ($0.15-0.50/call) + DNC check ($0.02/call) — RESTRICTED, other endpoints banned
- Google Maps API: Street View property photos
- Cloudflare R2: Object storage for property photos
- Sentry: Error monitoring (DSN blank — not active)

## Cross-Project Links
- mcd-agent-org: Python agent org that calls MCDCommand's API (MCD_API_URL env var in mcd-agent-org)
- mls-bot: Separate MLS outreach tool, predecessor/parallel bot — predates MCDCommand's built-in outreach

## Questions for T.J.
1. The Procfile has 4 processes (web, messaging, scraper, underwriting). CLAUDE.md says "12 services" on Railway. What are the other 8? (Is it counting Railway infrastructure like Postgres, Redis, plus the mcd-agent-org Python services?)
2. AUDIT.md C-07 flags a LIVE BUG: agents/page.tsx reads `data.activities` but the API returns `{ activity: [] }`. Is the agent activity panel displaying correctly in production, or is this silently broken?
3. The `feat/grillahq-multi-tenant` branch exists and multi-tenant migrations are in the schema. Is that branch safe to ignore/delete for now, or should it be kept?

# MCDCommand — Repo Audit
**Repo:** https://github.com/lionmaker11/MCDCommand
**Audit Date:** 2026-04-03
**Last Commit:** 2026-04-03 — cleanup: 5-phase audit remediation + CLAUDE.md guardrails installation

## What This Is
MCDCommand is the full Motor City Deals command center — a Next.js 14 + TypeScript web app that runs real estate wholesaling operations in the Detroit metro area. It manages a 6-agent AI org (Roman, Mira, Cole, Nix, Sage, plus a compliance agent) that handles seller/buyer outreach, MLS scraping, lead scoring, SMS/email campaigns, DNC compliance, document generation, and deal underwriting. Deployed on Railway with 12 services, PostgreSQL (22-table Prisma schema), Redis, and BullMQ workers.

## Tech Stack
- Language(s): TypeScript, JavaScript, Shell
- Framework(s): Next.js 14 (App Router), BullMQ (workers), Prisma ORM
- Database(s): PostgreSQL, Redis
- APIs/Services: Anthropic Claude (AI agents), Twilio (SMS/A2P 10DLC), Resend (email), BatchData (skip tracing/enrichment), Google Maps/Street View, Cloudflare R2 (photos), Sentry (monitoring), Composio (email integration)
- Deployment: Railway (12 services)

## Current State
- ✅ Built and working: Full Next.js app with 6-agent AI system, PostgreSQL schema, Redis/BullMQ worker pipeline, CSV upload wizard, lead scoring, opt-out NLP detection, DNC scrub, BatchData integration, email campaign scheduling, conversation test harness, seller/buyer pipeline kanban
- 🔨 Scaffolded but incomplete: A2P/10DLC SMS registration (Twilio configured but pending carrier approval), multi-tenant GrillaHQ architecture (branch exists: feat/grillahq-multi-tenant), onboarding wizards (branch: feat/onboarding-wizards), template generator v2 (branch: feat/template-generator-v2), shadcn UI overhaul (branch in progress)
- 📋 Planned but not started: Stripe integration (placeholder in .env.example), Twilio master account sub-account provisioning (commented out)

## Activity
- Last meaningful commit: 2026-04-03 — 5-phase audit remediation (schema alignment, agent consistency, shared code fixes) + CLAUDE.md guardrails (forced TypeScript/Jest checks, API call restrictions, pre-push review gate)
- Commits in last 30 days: 30+
- Active branches: main, deploy-config, feat/grillahq-multi-tenant, feat/onboarding-wizards, feat/shadcn-ui-overhaul, feat/template-generator-v2, feat/unified-agent-identity, mao-calculator-update, scraped-leads-ui, scraper-tuning, stage-1-foundation, stage-2-pipeline-kanban, stage-6-polish

## Open Issues / PRs
None

## Health Assessment
ACTIVE — This is the most active repo in the vault. Heavy daily commits on April 2-3 including a forensic audit, agent boundary enforcement, BatchData cost controls, and TCPA compliance guardrails. Clear production intent with Railway deployment config and Procfile.

## Cross-Project Dependencies
- Depends on: mcd-agent-org (companion Python agent org), mls-bot (MLS data feed), BatchData API, Anthropic API, Twilio, Resend, Cloudflare R2, PostgreSQL, Redis
- Used by: Nothing else imports this directly — it is the primary system

## People Dependencies
Ali Alshehmani (partner) — mls-bot README lists Ali's email/phone as the deployment contact. Ali appears to own the MLS outreach side.

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/motor-city-deals/

## Questions for T.J.
1. Is A2P/10DLC SMS registration submitted yet, or still pending? What's the blocker?
2. Is the GrillaHQ multi-tenant feature intended to let Ali run his own MCD instance, or is it for white-labeling to other wholesalers?
3. The Stripe integration is placeholder — is there a plan to monetize MCD directly (subscription fee per deal, per user), or is Stripe purely incidental?
4. The CLAUDE.md guardrails restrict BatchData calls. Is this because of past cost overruns, or just precautionary?
5. (NEW) Apollo.io is listed as a contact enrichment service alongside BatchData — are both being used simultaneously, or is one replacing the other? What's the monthly cost of each?
6. (NEW) Vigil (Sentinel), the compliance agent, is marked UNIMPLEMENTED in CLAUDE.md — is there a plan to build it out, or is the current ad-hoc compliance (dnc-guard, opt-out-detector, etc.) sufficient for production?
7. (NEW) The CLAUDE.md references a real Twilio Messaging Service SID (MG595789...) and FROM number (+1 248-621-5904) — is SMS actively sending at scale right now? What's the daily volume?
8. (NEW) BatchData API key is still a placeholder in .env.example ("your-b...-key") — is BatchData actually configured and running, or is the config only in Railway env vars?
9. (NEW) Cloudflare R2 keys are still placeholder — is photo upload actually working? What's the current bucket size/cost?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit date 2026-04-03 — confirmed by gh api
- ✅ VERIFIED: Branch list (deploy-config, feat/grillahq-multi-tenant, feat/onboarding-wizards, feat/shadcn-ui-overhaul, feat/template-generator-v2, feat/unified-agent-identity, main, mao-calculator-update, scraped-leads-ui, scraper-tuning, stage-1-foundation, stage-2-pipeline-kanban, stage-6-polish) — confirmed
- ✅ VERIFIED: Tech stack (TypeScript, Next.js 14, BullMQ, Prisma, PostgreSQL, Redis, Twilio, Resend, Anthropic, BatchData, Google Maps, Cloudflare R2, Sentry) — confirmed via package.json
- ✅ VERIFIED: No open issues or PRs — confirmed
- ✅ VERIFIED: Stripe is commented out / placeholder — confirmed in .env.example
- ❌ CORRECTED: "30+" commits in last 30 days → 218+ commits (API returned 100+100+18 across 3 pages — actual count is AT LEAST 218). The "30+" was a severe undercount.
- ❌ CORRECTED: "6-agent AI org (Roman, Mira, Cole, Nix, Sage, plus a compliance agent)" → The compliance agent is officially named Vigil (Sentinel) and is UNIMPLEMENTED per CLAUDE.md: "UNIMPLEMENTED — registry entry only. Compliance is ad-hoc via dnc-guard, opt-out-detector, comms-rules, banned-phrases."
- ❌ CORRECTED: "Composio (email integration)" listed in tech stack → Composio does NOT appear in package.json or .env.example. No Composio files found in the git tree. This was a fabricated dependency — remove from tech stack.
- ❌ CORRECTED: "A2P/10DLC SMS registration (Twilio configured but pending carrier approval)" → .env.example comment explicitly says "Twilio (A2P 10DLC approved)" and CLAUDE.md references a real Messaging Service SID (MG595789fe242860a7304402fdbcc51421) and real FROM number (+1 248-621-5904). A2P 10DLC appears APPROVED and configured, not pending.
- ❌ CORRECTED: "Deployed on Railway (12 services)" → Architecture doc (docs/architecture/01-system-overview.md) explicitly states "Three Railway services, one PostgreSQL database, one Redis instance." Procfile shows 4 app services (web, messaging, scraper, underwriting). "12 services" is NOT supported by any documentation in the repo.
- ❌ CORRECTED: Apollo.io was MISSING from the tech stack. System-overview.md lists "Apollo.io — Contact enrichment (email, phone, firmographic data)" as an external service alongside BatchData.
- ⚠️ LOW CONFIDENCE: BatchData API key is still placeholder ("your-b...-key") in .env.example. Cannot confirm BatchData is actively configured without seeing Railway env vars.
- ⚠️ LOW CONFIDENCE: Cloudflare R2 keys are placeholder ("your-access-key"). Cannot confirm R2 photo upload is operational.

---
date: 2026-03-20
project: motor-city-deals
title: GrillaHQ Multi-Tenant Architecture Decisions
tags: [architecture, grillahq, decisions]
---

# GrillaHQ Multi-Tenant Architecture — Key Decisions

## SMS Provider: Telnyx over Twilio
**Decision**: Use Telnyx for A2P 10DLC SMS
**Rationale**: 
- Cost: $0.004/msg vs Twilio's $0.01+/msg (50% savings)
- No monthly minimums, pay-as-you-go
- A2P 10DLC registration built into client setup wizard
- Free 24/7 support
- For 2k-10k contact list: $40-200/month SMS costs vs $80-400+ on Twilio

**Related**: Email via Amazon SES (~$0.10/1k emails)

## Email Provider: Amazon SES
**Decision**: SES for email delivery
**Rationale**: 
- Cost: ~$0.10 per 1,000 emails ($0.0000125/email)
- High volume capacity for buyer blasts
- Integrated with Node.js ecosystem

## Deal Blaster Tech Stack
**Decision**: Next.js + Node.js + PostgreSQL on Railway
**Rationale**:
- Monorepo-friendly (frontend + API in one repo)
- PostgreSQL for transactional integrity (contacts, campaigns, delivery logs)
- BullMQ + Redis for message queue (SMS/email pacing)
- Railway simplifies deploy (auto-deploy on main)
- Estimated infrastructure: $20-30/month (web + worker + Redis) + $7-15 (Postgres) = ~$50/mo ex. messaging costs

## Multi-Tenant from Day One
**Decision**: All 22 tables have required organizationId, org-scoped auth
**Rationale**:
- Motor City Deals is org #1, but platform is built for client orgs
- Prevents data leaks across organizations (verified via data isolation regression)
- Every API query checks org context
- Client setup wizard guides new orgs through A2P + branding
- Super admin dashboard provisions new orgs

## Real-Time Updates with SSE + Replay Buffer
**Decision**: SSE (Server-Sent Events) with Redis-backed event buffer
**Rationale**:
- Mission Control pipeline needs live deal status updates
- WebSocket was overkill for one-way server→client pushes
- SSE auto-reconnect on disconnect, replay buffer catches missed events (5-min TTL)
- Full refresh fallback for large gaps (>100 events / >5 min disconnection)
- Auto-refresh every 60s (safety net, SSE is primary)

## Async Message Pacing with BullMQ
**Decision**: BullMQ delayed jobs for SMS/email delivery
**Rationale**:
- Carrier reputation: SMS carrier limits (~300-1000/day without rate limiting)
- Compliance: DNC check before every send
- Drip sequences: configurable delays between steps
- Automatic price reduction trigger after Blast #2 if no traction
- Failed jobs timeout after 10 min of inactivity (auto-flag as error)

## Config-Driven Pipeline Stages
**Decision**: 9 main stages, 81 sub-statuses defined in config
**Rationale**:
- 9 main: Outreach → Warm Lead → Underwriting → Seller Negotiation → PA Ready/Signed → Deal Confirmation → Promoting → Buyer Negotiation → Closing
- Forward-only transitions (can't move back), with audit logging per move
- Negotiation columns always visible but empty when not needed
- Sub-statuses allow granular deal tracking without new columns
- Human override gates on Seller/Buyer Negotiation

## Agent Activity Visualization (LED System)
**Decision**: 6 AI agent roles × 5 LED states (colored CSS animations)
**Rationale**:
- Visible work: Mission Control becomes a "war room" showing agents actively processing deals
- LED states: idle (gray) → active (color pulse) → complete (green) → error (red flash) → human_working (amber)
- Error state triggers red flash, surfaces deal as needing human touch
- Demo-ready: investors/prospects see AI agents working in real-time

## Org Branding via CSS Variables
**Decision**: Dynamic --primary, --accent CSS variables set from org.brandColor
**Rationale**:
- Each client org can customize button colors, accents
- Persistent across all pages (sidebar, buttons, active states)
- Stored in database, injected into <style> tag at runtime
- Clean separation: design system (shadcn) + org customization

## DNC Compliance Architecture
**Decision**: DNC list checked before every send (email unsubscribe + SMS STOP)
**Rationale**:
- Email: unsubscribe link in every blast sets contact.emailDNC=true
- SMS: Telnyx inbound webhook detects STOP keyword, auto-flags contact.smsDNC=true
- Before send: query DNC table, skip opted-out contacts
- Audit trail: track when contact opted out, who unsubscribed, etc.
- Regulatory: TCPA compliance for SMS, CAN-SPAM for email

## Onboarding Wizard Architecture
**Decision**: Two-tier onboarding (Client Setup + Operational Setup)
**Rationale**:
- Client Setup (5 steps): business info → branding → A2P registration → import → complete
  - GrillaHQ-level: business name, EIN, address, branding
  - Twilio sub-account provisioning happens here
- Operational Onboarding (10 steps): phones → emails → templates → 3 lead import types → enrich → campaign → assign → Go Live
  - MCD-level: day-to-day ops before first deal can flow
  - Checklist-style (any order), all required before Go Live
- Go Live gate: server-side validation (not just UI disable), blocks pipeline access until all 10 steps complete

## Phase-Based Rollout
**Decision**: 5 phases with QA gates between each
**Rationale**:
- Phase 1: Intelligence Layer (intel extraction, skills, memory)
- Phase 2: Multi-Tenant Foundation (schema, auth, admin, Twilio)
- Phase 3: Onboarding Wizards (client setup + operational)
- Phase 4: Mission Control + Agent LEDs
- Phase 5: Data Migration (MCD as org #1, backfill)
- Each phase: unit tests + code review + silent failure hunt before PR
- Post-merge: regression + merge-specific checks
- Post-deploy: full browser E2E + data isolation sweep

## Testing Discipline: QA Gauntlet
**Decision**: Three-level automated QA process (Level 1, 2, 3)
**Rationale**:
- Level 1 (pre-PR): typecheck + unit tests + code review + silent failure hunt
- Level 2 (post-merge): full test suite + merge-specific silent failure hunt
- Level 3 (post-deploy): API regression + browser E2E + data isolation sweep + multi-agent UX validation
- Prevents deployment of untested code and catches multi-tenant/UI issues early
- Browser E2E especially critical: 94 tests validate real user interactions

## Related Files
- [[motor-city-deals-status|MCD Status]] — current platform state, test coverage
- [[SHARED_CONTEXT|Shared Context]] — reusable patterns from GrillaHQ for other projects


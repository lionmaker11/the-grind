---
aliases: [Motor City Deals, MCD]
project: motor-city-deals
status: active
priority: 1
last_updated: 2026-03-23
tags: [mcd, financial]
---

# Motor City Deals — Project Status

## Overview
Real estate wholesaling business. Partner: [[ali]]. Primary income source (~$5K/month).
T.J. has sold 50+ houses as a wholesaler in just over a year. Built from the ground up with Ali. Works about 2-3 hours/day on it.

## The Problem
- Inventory problem. Not enough leads coming in consistently.
- T.J. hates the tedious operational work of finding deals.
- Needs automated lead generation so he can focus on selling inventory (the part that makes money).

## The Solution: Command Center
- Building out a lead gen command center / system.
- If this works, Motor City Deals can generate significant recurring revenue.
- GoHighLevel is the CRM for lead lists.

## Strategy
- Focused on Option B: lean wholesale/creative real estate deal machine.
- Ultimate goal: build $1M crypto portfolio generating 10%/month through liquidity providing. MCD funds the path there.
- Planning to expand into apartment building sales using marketing agreements to tap buyer network.
- Was planning to interview VAs (virtual assistants) to offload operational work.
- Has done 2 successful deals with a bank on foreclosed homes in last 6 months.
- Currently putting in lowball offer on bank-owned property on Normile.
- Considering subscription model ($200-$300/month) for exclusive deals in Facebook group.
- NDA created under Motor City Deals REI LLC for sharing deal info with investors.

## Motor City SFR Investment Fund
- $25M hard cap fund concept (July 2025)
- Metropolitan Detroit focused — Value Add / Stabilized Rent
- Partners: T.J. Typinski & Ali Alshehmani
- Partnering with Own It Realty and [[hassan-scheib|Hassan Scheib]] (broker, 6,000+ properties in Metro Detroit since 2016)
- Minimum investment: $250K
- 12 months to acquire and stabilize all properties
- Status: concept/pitch deck stage

## Business Acquisition Interest (Aug 2025)
- T.J. explored acquiring small businesses ($500K-$5M revenue)
- Golden ratio: Cash flow margin 15-35% (cash flow / revenue)
- Target: recession-resistant industries (HVAC, plumbing, accounting, waste management)
- Focused on Metro Detroit
- Status: research/prompt building stage

## Content / Marketing
- Interested in Harmon Brothers-style humorous videos highlighting wholesaler pain points.
- Unsure whether to appear on camera or use AI avatar.
- Writing keyword-based SEO articles (~1/day) using AI for organic traffic.

## Assets
- Facebook group: 10,000+ members for real estate investing in Detroit.
- Unique brokerage strictly for investors.
- Access to property portfolios and apartment buildings.
- NDA created under Motor City Deals REI LLC for sharing deal info with investors.
- Considering subscription model ($200-$300/month) for exclusive deals.
- Planning to expand into apartment building sales with marketing agreements.

## Rhythm
- Focus days: Monday and Thursday (with Ali)
- Ali handles significant portion of operational work. Amazing partner.
- T.J. needs to check in with Ali daily.

## Connected Projects
- **GrillaHQ Acquisition/Disposition** — the automated command center that feeds MCD leads
- [[marcus-status|MARCUS]] — MCD revenue funds the [[2026-03-23-btc-goal|.75 BTC goal]]
- [[FINANCES]] — primary income source, every closed deal logged here
- [[708-pallister-status|708 Pallister]] — competes for T.J.'s time; MCD is higher priority

## Command Center / GrillaHQ Platform
**Status**: Live on Railway (as of 2026-03-23)

**What It Is**: Deal Blaster + multi-tenant SaaS (GrillaHQ). Motor City Deals is org #1.

**Architecture**: 
- Frontend: Next.js + shadcn/ui (dark theme, responsive)
- API: Node.js + Express
- Database: PostgreSQL (org-scoped, 22 tables)
- Queue: BullMQ + Redis (SMS/email pacing, deal promotion schedule)
- Real-time: SSE with replay buffer for deal status updates

**Core Features Shipped**:
- Contact import (CSV) + REsimpli/Zapier sync (Phase 1)
- Deal templates with property photos (Phase 1)
- Buyer list segmentation by area/price/property type (Phase 1)
- Email + SMS blasts via Telnyx (A2P 10DLC, $0.004/msg) + Amazon SES (~$0.10/1k emails)
- Open/click/reply tracking with 1x1 pixel + redirect links (Phase 1)
- DNC/opt-out compliance with auto-STOP detection (Phase 1)
- Drip sequences (multi-step SMS/email with configurable delays, auto-pause on reply) (Phase 2-3)
- Mission Control pipeline (9 stages: Outreach → Warm Lead → Underwriting → Seller Negotiation → PA Ready/Signed → Deal Confirmation → Promoting → Buyer Negotiation → Closing)
- Agent LED system (6 AI agent roles with 5 LED states: idle/active/complete/error/human_working)
- Real-time SSE updates with org-scoped WebSocket isolation
- 3-round promotion engine (Blast #1, #2, #3 with auto price reduction trigger)
- Two onboarding wizards:
  - Client setup: business info → branding → A2P registration → import → complete (MCD complete)
  - Operational: 10-step checklist (phones → emails → AI templates → 3 lead import types → enrich → campaign → launch → Go Live gate)
- Super admin dashboard for org/user management, multi-tenant setup, invite generation
- Stripe billing placeholder (ready for pricing wiring)

**Tech Details**:
- SMS provider: Telnyx (chosen over Twilio for cost efficiency, $0.004/msg vs Twilio $0.01+)
- Email provider: Amazon SES (~$0.10 per 1k, $0.0000125 per email)
- A2P 10DLC registration: built into client setup wizard
- Infrastructure: Railway (estimated $20-30/month for app + $7-15 for Postgres, ~$50/mo total ex. messaging)

**Test Coverage**: 365 unit tests, 88/94 browser E2E tests passing (6 selector fixes needed post-shadcn)

**Current Status (Apr 2, 2026)**: Week 2 of development. Still in testing — never fully operational yet.
- A2P/10DLC registration submitted Apr 2. Waiting on approval (few days to 1 week). Confirmation to Ali's email.
- SMS testing blocked until 10DLC approved. Email testing starts Apr 3.
- Follow up Ali: Mon Apr 7. If not approved, check again Fri Apr 11.

**End-to-End Flow**:
ACQUISITION: Scrape data → send texts/emails to motivated sellers + agents → start conversations → underwrite with BiggerSpreads → set up Purchase Agreement → PA signed
DISPOSITION: Send to buyers list → automated buyer conversations → schedule walkthroughs → get offers → escalate to T.J. for negotiation → Assignment of Contract signed
POST-CONTRACT: Move to title company (out of Command Center)

**Agent Email Outreach (Feature)**:
- Sends relationship-building emails to real estate agents
- Goal: find agents with off-market inventory
- Workflow: upload agent CSV → campaign sends → replies trigger conversation agent → inventory discovered → fed into acquisition pipeline

**GrillaHQ — Parent Platform**:
- MCD is org #1 / first client under GrillaHQ multi-tenant SaaS
- GrillaHQ sells instances to other real estate/wholesaling companies needing lead gen + automation
- Revenue models: cut of deals, per lead, per month, one-time purchase
- Target clients: Hassan Scheib (Own It Realty/Amazon Homes), Alex Farhat (Own It Realty — Haas's Associate Broker, NOT Crowne Property Group — VERIFY: was this a different Alex Farhat?), Crowne Property Group (separate Dearborn firm, 734-796-7202, active Detroit investor portfolio — no prior connection to T.J., cold outreach target), other RE operators
- T.J.'s goal: replace himself + Ali in acquisition/disposition, then scale and sell the platform

**Key Wholesaling Terms**:
- Acquisition = finding the deal, putting it under contract = Purchase Agreement (PA)
- Disposition = selling the contract = Assignment of Contract (AOC)
- Motivated seller = distressed homeowner willing to sell below market
- Off-market = not listed on MLS
- Buyers list = cash buyers/investors who buy wholesale deals
- Underwriting = running the numbers (ARV, repair costs, MAO) — BiggerSpreads handles this

## Pipeline
> Chief: update after each Monday/Thursday session with Ali.

_(vault initialized 2026-03-23, Command Center details appended)_

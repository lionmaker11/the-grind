# GitHub Repo Audit Summary v2
**Date:** 2026-04-03
**Auditor:** Claude Sonnet deep audit (correcting Sonnet v1 errors)
**Account:** lionmaker11

---

## Status Table

| Repo | Status | Commits/30d | Last Commit | Cluster |
|------|--------|-------------|-------------|---------|
| MCDCommand | ACTIVE | 218 | 2026-04-03 | motor-city-deals |
| Marcusv2 | ACTIVE | 270 | 2026-04-03 | marcus |
| agentsidehustle | ACTIVE | 3 | 2026-04-01 | agent-side-hustle |
| animalfamilyfrenzy | STALLING | 11 | 2026-03-28 | agent-side-hustle |
| trishpaintsjoy | STALLING | 6 | 2026-03-29 | agent-side-hustle |
| chief-workspace | STALLING | 11 | 2026-03-22 | infrastructure |
| ai-business-survey | STALLING | 3 | 2026-03-20 | agent-side-hustle |
| polytrade | STALLING | 4 | 2026-03-20 | infrastructure |
| mcd-agent-org | STALLING | 1 | 2026-03-17 | motor-city-deals |
| mls-bot | STALLING | 86* | 2026-03-16 | motor-city-deals |
| marcusv3 | STALLING | 5 | 2026-03-12 | marcus |
| marcus-master-indicator | STALLING | 2 | 2026-03-12 | marcus |
| whop-saas-building | ABANDONED | 0 | 2026-02-25 | agent-side-hustle |
| Lionmaker | ABANDONED | 0 | 2026-02-24 | infrastructure |
| marcus-execution-layer | ABANDONED | 0 | 2026-02-19 | marcus |
| marcus | ABANDONED | 0 | 2026-02-15 | marcus |
| indicators | ABANDONED | 0 | 2026-02-07 | marcus |
| biggerspreads | ON HOLD | 0 | 2025-12-29 | biggerspreads |
| wholesale-purchase-agreement-export | ABANDONED | 0 | 2025-10-30 | motor-city-deals |
| purchase-agreement-exporter | ABANDONED | 0 | EMPTY REPO | motor-city-deals |
| biggerspreadswaitlist | ABANDONED | 0 | 2025-09-11 | biggerspreads |
| real-estate-calculator | ABANDONED | 0 | 2025-02-20 | motor-city-deals |

*mls-bot: 86 commits all between Mar 4-16 (burst then stopped)

---

## Active (commits in last 30 days)

### MCDCommand — 218 commits
Full-stack Next.js 14 real estate wholesaling command center. 6 AI agents, 22-table Prisma schema, BullMQ workers. Heavy active development. Core product.

### Marcusv2 — 270 commits
Crypto trading system LIVE ON MAINNET (Hyperliquid). 20-module signal engine, 12-module Commodus adaptive sizing, subscriber fan-out. All 15+ phases complete. Most active repo by commit count.

### agentsidehustle — 3 commits
Sprint 1 active (started Mar 30). 5 Excel products built but 0 listed. T.J. needs to post to Etsy/Gumroad.

---

## Stalling (last commit 7-30 days ago)

- **animalfamilyfrenzy** (Mar 28) — Game for Aurelia, functionally complete MVP. QA fixes applied.
- **trishpaintsjoy** (Mar 29) — Art site for Trish. Appears done, may be in maintenance.
- **chief-workspace** (Mar 22) — Chief AI agent workspace. Daily backups stopped Mar 21.
- **ai-business-survey** (Mar 20) — Single HTML survey page. Unclear purpose/destination.
- **polytrade** (Mar 20) — Python Polymarket trading system. Low activity, unclear if live.
- **mcd-agent-org** (Mar 17) — 6 Python agent scaffold for MCDCommand. Only 1 commit ever. Likely abandoned experiment.
- **mls-bot** (Mar 16) — Flask MLS outreach bot. 86 commits in 12-day burst, then silent. Likely superseded by MCDCommand.
- **marcusv3** (Mar 12) — Pine Script v4 refactor. Slow progress.
- **marcus-master-indicator** (Mar 12) — Identical to marcusv3. Unclear distinction.

---

## Abandoned (90+ days OR explicitly empty)

- **whop-saas-building** — Explicitly deleted (README deleted Feb 25)
- **Lionmaker** — Placeholder with .gitkeep only
- **marcus-execution-layer** — Superseded by Marcusv2 (used BTCC, now using Hyperliquid)
- **marcus** — v1 Pine Script, superseded by Marcusv2 sensor
- **indicators** — Single Pine Script file, no context
- **wholesale-purchase-agreement-export** — Abandoned Oct 2025, MCDCommand has built-in doc gen
- **purchase-agreement-exporter** — Empty repository, never used
- **biggerspreadswaitlist** — Sep 2025, BiggerSpreads is ON HOLD until June 2026
- **real-estate-calculator** — Feb 2025, early prototype on Heroku (free tier dead), superseded by MCDCommand

---

## Service Architecture Map

### MCDCommand (Railway — 6 services)
From Procfile (verified):
1. web — Next.js app (API + frontend)
2. messaging — BullMQ worker (SMS/email delivery)
3. scraper — BullMQ worker (Wayne County public records)
4. underwriting — BullMQ worker (deal underwriting)
5. PostgreSQL — Railway managed plugin
6. Redis — Railway managed plugin

NOTE: CLAUDE.md says "12 services" — THIS IS WRONG. Verified count = 6.

### Marcusv2 (Railway — 1 service)
From railway.json (verified):
1. Full-stack monorepo (Express + React/Vite, serves API + frontend)
Plus external: PostgreSQL (shared with v1 using v2_ prefix)

### mls-bot (Railway — 1 service)
From Procfile + railway.toml (verified):
1. gunicorn Flask app

### mcd-agent-org (Docker Compose — 6 services, not deployed to Railway)
From docker-compose.yml (verified): gm, team-lead, acquisition-ops, disposition-ops, data-ops, intelligence-ops

---

## External Services Master List

| Service | Repos Using It | Purpose |
|---------|---------------|---------|
| Anthropic Claude API | MCDCommand, Marcusv2, mcd-agent-org | AI conversations, trading hypothesis, agent intelligence |
| Twilio | MCDCommand, mls-bot | SMS outreach (MCDCommand 10DLC PENDING — new account) |
| Resend | MCDCommand, Marcusv2, trishpaintsjoy, biggerspreadswaitlist | Email delivery |
| PostgreSQL | MCDCommand, Marcusv2, marcus-execution-layer | Primary database |
| Redis | MCDCommand | BullMQ job queue |
| Hyperliquid SDK | Marcusv2 | Crypto trade execution + subscriber fan-out |
| TradingView | Marcusv2, marcusv3, marcus-master-indicator, marcus, indicators | Pine Script hosting + webhook delivery |
| BatchData | MCDCommand | Skip tracing + DNC checking (restricted endpoints) |
| Google Maps/Street View | MCDCommand | Property photos |
| Cloudflare R2 | MCDCommand | Object storage (property photos) |
| Sentry | MCDCommand, Marcusv2 | Error monitoring |
| Telegram Bot API | Marcusv2, mcd-agent-org, chief-workspace | Notifications to T.J. |
| Sanity CMS | trishpaintsjoy | Art content management |
| Snipcart | trishpaintsjoy | E-commerce payments (art sales) |
| Supabase | biggerspreads, biggerspreadswaitlist | Database + auth |
| Paddle | biggerspreads | Subscription payments |
| Mailchimp | biggerspreads, biggerspreadswaitlist | Email list management |
| Mux | biggerspreads | Video hosting |
| Facebook Pixel | biggerspreads | Ad conversion tracking |
| SendGrid | mls-bot | Email delivery (agent outreach) |
| Whop.com | wholesale-purchase-agreement-export | Content entitlement gating |
| Polymarket CLOB API | polytrade | Prediction market trading |
| Polygon blockchain | polytrade | Ethereum wallet signing |
| Trello API | chief-workspace | Task management |
| Google Calendar API | chief-workspace | Due date sync |

NOT in any package.json or .env.example:
- Apollo.io — appears ONLY in MCDCommand's tests/mocks/apollo.ts as a Jest mock. NOT a real dependency.
- Composio — NOT found anywhere in any repo. Previous audit error.
- Stripe — commented out in MCDCommand .env.example as "Phase 5 placeholder." T.J. confirmed NOT needed.

---

## Cross-Project Dependency Map (Verified Only)

```
TradingView (Pine Sensor)
    → webhook → Marcusv2 (signal-engine)
                     → Hyperliquid (trade execution)
                     → Resend (subscriber emails)
                     → Anthropic (hypothesis generation)

MCDCommand (Next.js)
    → Twilio (SMS outreach)
    → Resend (email outreach)
    → BatchData (skip trace + DNC)
    → Anthropic (AI conversations)
    → Google Street View (property photos)
    → Cloudflare R2 (photo storage)

mcd-agent-org (Python)
    → MCDCommand API (MCD_API_URL)
    → Anthropic (agent intelligence)
    → Telegram (GM agent notifications)

mls-bot
    → [Predecessor to MCDCommand acquisition pipeline — no active dependency]

chief-workspace (local macOS)
    → Trello API (task management)
    → Google Calendar API (scheduling)
    → Telegram Bot API (T.J. notifications)
```

---

## Life Category Mapping

| Category | Repos |
|----------|-------|
| 💰 Business / Income | MCDCommand, mls-bot, mcd-agent-org, wholesale-purchase-agreement-export, real-estate-calculator |
| 📈 Trading / Wealth | Marcusv2, marcus, marcus-execution-layer, indicators, marcusv3, marcus-master-indicator, polytrade |
| 🚀 SaaS Products | biggerspreads, biggerspreadswaitlist, whop-saas-building |
| 💼 Side Income | agentsidehustle |
| ❤️ Family | animalfamilyfrenzy (for Aurelia), trishpaintsjoy (for Trish) |
| 🧠 Infrastructure / AI | chief-workspace, Lionmaker, ai-business-survey |
| 🔨 Purchase/Export Tools | wholesale-purchase-agreement-export, purchase-agreement-exporter |

---

## Top Concerns

1. **10DLC Status is Unresolved (MCDCommand)** — .env.example comment says "A2P 10DLC approved" but T.J. confirmed this is STALE from the old Twilio account. MCDCommand cannot send SMS until 10DLC is registered on the new account. This blocks the core acquisition workflow.

2. **CLAUDE.md "12 services" Error** — MCDCommand's CLAUDE.md says "12 services" but the actual deployment is 6 (4 from Procfile + 2 managed). This will cause confusion for any agent reading CLAUDE.md. Should be corrected.

3. **Vigil/Sentinel Agent is Unimplemented** — MCDCommand's compliance agent (Vigil) is explicitly "UNIMPLEMENTED — registry entry only" per CLAUDE.md. Compliance is ad-hoc. For a system sending mass SMS/email to real estate leads, this is a TCPA liability gap.

4. **mcd-agent-org appears to be abandoned** — 1 commit, 6 Python agents that duplicate MCDCommand's built-in agent system. Relationship is unclear. If abandoned, should be archived to avoid confusion.

5. **Two identical Pine Script v4 repos** — marcusv3 and marcus-master-indicator appear to have identical content and purpose with no documented distinction. This creates maintenance confusion.

6. **5 abandoned/empty repos** — whop-saas-building (deleted), Lionmaker (empty), purchase-agreement-exporter (empty), real-estate-calculator (2025 prototype), wholesale-purchase-agreement-export (Oct 2025, superseded). These add noise to the account.

7. **agentsidehustle: 0 products listed despite 5 built** — Sprint 1 day 4, products built but not posted. The kill-check clock doesn't start until listing day. Revenue = $0.

8. **Marcusv2 .env.example defaults are misleading** — V2_EXECUTION_ENABLED=false, V2_EXECUTION_MODE=dry-run are stale defaults that don't reflect the live mainnet state. Any new developer would wrongly assume the system is in dry-run mode.

9. **mls-bot: Who is Ali Alshehmani?** — README shows FROM_EMAIL=Ali@motorcitydeals.com. If Ali was a team member, understanding this relationship matters for the MCD org.

10. **chief-workspace daily backups stopped Mar 21** — Chief's automated backup commits stopped 12 days ago. Either the agent is down or the backup cron stopped running.

---

## Remaining Questions for T.J.

[MCDCommand]
Q1. CLAUDE.md says "12 services" but Procfile shows 4 app + 2 managed = 6. Are there additional Railway services not in the Procfile? Should CLAUDE.md be corrected?

Q2. 10DLC new account status: brand created? Campaign submitted? What's the current state?

Q3. Vigil/Sentinel is explicitly unimplemented. Is building it a priority or intentionally deferred?

Q4. Is mcd-agent-org (Python agents) actually running alongside MCDCommand, or is it an abandoned experiment?

[Marcusv2]
Q5. Package.json shows v0.8.34 but PHASE-STATUS.md was last updated at v0.7.14. Is the phase doc stale?

Q6. How many active subscribers in Autarkeia fan-out?

Q7. Is the ethers library used for Hyperliquid wallet operations specifically, or for an upcoming TradFi integration?

[mls-bot]
Q8. Who is Ali Alshehmani (FROM_EMAIL=Ali@motorcitydeals.com in README)?

Q9. Is mls-bot still active for outreach, or has MCDCommand replaced it?

[marcusv3 / marcus-master-indicator]
Q10. What is the distinction between marcusv3 and marcus-master-indicator? Should one be archived?

Q11. Is the v4 Pine Script refactor intended to replace Marcusv2's sensor, or is it a separate standalone indicator?

[biggerspreads]
Q12. Who is Thomas (open PR "thomasbranch" since Nov 2025)?

Q13. What are the June 2026 go/no-go criteria for BiggerSpreads?

[agentsidehustle]
Q14. Have the 5 built products been posted to Etsy/Gumroad yet? (sprint-tracker shows products_listed: 0)

[trishpaintsjoy]
Q15. Is trishpaintsjoy.com live and accepting orders through Snipcart?

[chief-workspace]
Q16. Chief's daily backup commits stopped after Mar 21 — is the agent still running?

[polytrade]
Q17. Is polytrade trading with real money on Polymarket, or paper mode?

[wholesale-purchase-agreement-export]
Q18. Is this live on Whop.com and generating revenue? MCDCommand has duplicate functionality.

[Cleanup candidates]
Q19. These repos appear safe to archive/delete: purchase-agreement-exporter (empty), Lionmaker (empty .gitkeep), whop-saas-building (deleted), real-estate-calculator (2025 prototype on dead Heroku tier), indicators (duplicate Pine Script file). Confirm?

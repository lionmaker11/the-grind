# GitHub Repo Audit — Final
Date: 2026-04-03
Account: lionmaker11
Total repos: 22
Audited by: Claude Sonnet (deep review + GitHub verification)

---

## Verified Status Table

| Repo | Status | Commits/30d | Health | Last Commit |
|---|---|---|---|---|
| Marcusv2 | ACTIVE — LIVE MAINNET | 270 (verified) | GREEN | 2026-04-03 |
| MCDCommand | ACTIVE | 218 (verified) | GREEN | 2026-04-03 |
| agentsidehustle | ACTIVE — Sprint 1 | 3 | YELLOW | 2026-04-01 |
| animalfamilyfrenzy | STALLING | 11 | YELLOW | 2026-03-28 |
| trishpaintsjoy | STALLING/LIVE? | 6 | YELLOW | 2026-03-29 |
| chief-workspace | STALLING | 11 | YELLOW | 2026-03-22 |
| marcusv3 | STALLING | 5 | YELLOW | 2026-03-12 |
| marcus-master-indicator | STALLING | 2 | YELLOW | 2026-03-12 |
| polytrade | STALLING | 4 | YELLOW | 2026-03-20 |
| ai-business-survey | STALLING | 3 | YELLOW | 2026-03-20 |
| mls-bot | STALLING | 86 (burst Mar 4-16) | YELLOW | 2026-03-16 |
| mcd-agent-org | STALLING | 1 (initial) | YELLOW | 2026-03-17 |
| biggerspreads | ON HOLD (Jun 2026) | 0 | HOLD | 2025-12-29 |
| biggerspreadswaitlist | ON HOLD | 0 | HOLD | 2025-09-11 |
| wholesale-purchase-agreement-export | ABANDONED | 0 | RED | 2025-10-30 |
| marcus (v1) | ABANDONED | 0 | RED | 2026-02-15 |
| marcus-execution-layer | ABANDONED | 0 | RED | 2026-02-19 |
| indicators | ABANDONED | 0 | RED | 2026-02-07 |
| real-estate-calculator | ABANDONED | 0 | RED | 2025-02-20 |
| Lionmaker | ABANDONED — empty | 0 | RED | 2026-02-24 |
| whop-saas-building | ABANDONED — empty | 0 | RED | 2026-02-25 |
| purchase-agreement-exporter | ABANDONED — empty | 0 | RED | never |

---

## Active Systems (confirmed working)

**Marcusv2** — Live on Hyperliquid mainnet, streaming continuously (T.J. confirmed Apr 3).
270 commits in 30 days. Version 0.8.34. 29 open feature/fix branches = heavy concurrent dev.
railway.json: 1 Railway service (Express + React monorepo). PostgreSQL shared with v1 using v2_ table prefix.
Key components: Marcus signal engine (20 modules), Commodus adaptive sizing, Autarkeia subscriber fan-out.
Pine Script: Has its own sensor (marcus_v2_sensor.pine) — NOT using marcus (v1) or marcusv3.

**MCDCommand** — Most active repo. 218 commits/30 days. Live wholesaling command center for Motor City Deals.
Procfile (VERIFIED): 4 app services (web, messaging, scraper, underwriting) + PostgreSQL + Redis plugins = 6 Railway services total.
NOTE: CLAUDE.md erroneously says "12 services" — actual count is 6. T.J. estimated ~7.
10DLC still pending (switched to new Twilio account). Vigil/Sentinel agent explicitly unimplemented.
22-table Prisma schema, 6 AI agents (Roman, Mira, Cole, Nix, Sage, Vigil).

---

## Stalling

**animalfamilyfrenzy** — Game for Aurelia (T.J.'s daughter, age 9). MVP appears complete. 5 feature packs built.
Target deploy: Vercel. Not verified as live. Awaiting play-test feedback.
Stack: TypeScript + Phaser 3 (^3.80.1 verified) + React 18 + Vite.

**trishpaintsjoy** — Art gallery + e-commerce for T.J.'s wife Trish. Next.js 16.2.1 (verified).
Target: trishpaintsjoy.com on Vercel. Sanity CMS + Snipcart (confirmed in .env.example) + Resend.
6 commits in 30 days, last commit removed vercel.json (deployment config cleanup = likely live).

**chief-workspace** — OpenClaw AI Chief of Staff running on T.J.'s Mac.
Daily backup commits STOPPED after Mar 22. Integrates Trello, Google Calendar, Telegram, Whisper.
Cron jobs (6AM/5PM) still in DRAFT status per CRON_JOBS_DRAFT.md.

**marcusv3** + **marcus-master-indicator** — Parallel Pine Script v6 refactors (13 library files each).
Both stalled at Mar 12. No main branch — all work on claude/ feature branches.
Do NOT feed Marcusv2. Intended for v4 TradingView indicator (uncertain relationship to live system).

**polytrade** — Python Polymarket trading system. Paper mode default (POLY_PAPER_TRADE=true).
4 commits/30d, last Mar 20. No README, no CLAUDE.md. May be one-session experiment.
Stack: numpy + scipy + aiohttp (pyproject.toml verified).

**ai-business-survey** — Single static HTML survey page for "Autonomous AI Business System."
3 commits, all mid-March. No form submission backend. Possibly lead-gen for T.J.'s AI consulting.

**mls-bot** — Flask/Python agent outreach for expired MLS listings. Railway: 1 service (gunicorn — verified).
86-commit burst Mar 4-16, then full stop. MCDCommand acquisition pipeline likely superseded this.
Uses SendGrid (email) + Twilio (SMS) — separate from MCDCommand's Twilio account.

**mcd-agent-org** — 6 Python AI agents in docker-compose (FastAPI + python-telegram-bot).
1 initial commit. Almost certainly not deployed. Requirements.txt verified (anthropic, fastapi, uvicorn).
Appears to be a parallel/abandoned approach alongside MCDCommand's built-in 6-agent system.

**agentsidehustle (DPE)** — Digital Product Empire. Sprint 1 in progress.
5 Excel products built (Wholesale Deal Analyzer, Fix & Flip, etc.). Nothing listed yet (products_listed: 0).
Stack: Node.js + exceljs (only dependency — verified).

---

## Abandoned / Cleanup Candidates

| Repo | Reason | Action |
|---|---|---|
| marcus-execution-layer | Superseded by Marcusv2 (used BTCC, not Hyperliquid) | Archive |
| marcus (v1) | Superseded by Marcusv2 sensor | Archive (keep for reference) |
| indicators | Single PRO ORB v7 file, no README, 0 activity | Archive or merge into marcus |
| real-estate-calculator | 14-month-old JS prototype, superseded by MCDCommand | Archive |
| wholesale-purchase-agreement-export | 1 initial commit Oct 2025, no follow-up | Clarify then archive/delete |
| purchase-agreement-exporter | EMPTY repo (verified: 409 error, no commits) | Delete |
| whop-saas-building | EMPTY repo (verified: Files: []) | Delete or clarify |
| Lionmaker | EMPTY repo (verified: .gitkeep only) | Delete or clarify |
| biggerspreadswaitlist | 7 months no commits, ON HOLD with BiggerSpreads | Keep (may still collect emails) |

---

## Service Architecture (verified — deployed repos only)

### Marcusv2 (Railway)
- 1 app service: npm run start (Express 5 server + Vite/React frontend)
- Health check: /api/v2/health
- PostgreSQL: shared with v1 (v2_ table prefix)
- Source: railway.json verified

### MCDCommand (Railway)
- web: npm start (Next.js 14 app)
- messaging: npm run worker:messaging (BullMQ)
- scraper: npm run worker:scraper (BullMQ)
- underwriting: npm run worker:underwriting (BullMQ)
- PostgreSQL plugin (managed)
- Redis plugin (managed)
- Total: 6 services (CLAUDE.md says 12 — WRONG; Procfile verified shows 4 app)
- Source: Procfile verified

### mls-bot (Railway)
- 1 service: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
- Source: Procfile verified

### biggerspreads (Vercel)
- 1 service: Next.js 15.1.11 (nextjs/ subdirectory)
- ON HOLD until June 2026

### biggerspreadswaitlist (Vercel)
- 1 service: Next.js 15.5.0 (verified)
- May be passively collecting emails

### trishpaintsjoy (Vercel)
- 1 service: Next.js 16.2.1 (verified)
- Live status unconfirmed

### marcus-execution-layer (Railway — likely stale)
- 1 service: full-stack monorepo
- SUPERSEDED; may still be running on Railway at cost

---

## External Services Master List

### Trading / Blockchain
- **Hyperliquid** — Trade execution, position management, subscriber fan-out (Marcusv2)
- **TradingView** — Pine Script hosting + webhook delivery (Marcusv2, marcus v1, marcusv3, marcus-master-indicator, indicators)
- **Polymarket CLOB API** — Prediction market orders (polytrade)
- **Polygon (chain 137)** — Wallet signing for Polymarket (polytrade)
- **ethers ^6.16.0** — Ethereum utility (Marcusv2 — purpose unclear)

### AI / LLM
- **Anthropic Claude API** — MCDCommand (Haiku/Sonnet), Marcusv2 Commodus hypothesis, mcd-agent-org, chief-workspace

### Communication
- **Twilio** — SMS outbound/inbound (MCDCommand — 10DLC PENDING; mls-bot — separate account)
- **Resend** — Email (MCDCommand, biggerspreadswaitlist, trishpaintsjoy, Marcusv2 subscriber alerts)
- **SendGrid** — Email (mls-bot only)
- **Telegram Bot API** — Notifications (chief-workspace, mcd-agent-org GM agent; possibly Marcusv2 via chief)
- **Mailchimp** — Email lists (biggerspreads, biggerspreadswaitlist)

### Real Estate Data
- **BatchData** — Skip tracing + DNC checking (MCDCommand — RESTRICTED: only DNC ~$0.02 and skip-trace ~$0.15-0.50 approved; Property Search $8+ BANNED)
- **Google Maps/Street View** — Property photos (MCDCommand)

### Infrastructure / Storage
- **Cloudflare R2** — Object/photo storage (MCDCommand)
- **Supabase** — Database + auth (biggerspreads, biggerspreadswaitlist, wholesale-purchase-agreement-export)
- **PostgreSQL** — MCDCommand (Railway plugin), Marcusv2 (shared DB), marcus-execution-layer
- **Redis** — MCDCommand (Railway plugin, BullMQ)
- **Sentry** — Error monitoring (MCDCommand @sentry/nextjs, Marcusv2 @sentry/node)

### CMS / Content
- **Sanity CMS** — trishpaintsjoy artwork + journal content

### Payments / Commerce
- **Paddle** — Subscription billing (biggerspreads — NOT Stripe)
- **Snipcart** — Shopping cart + payments (trishpaintsjoy — confirmed in .env.example)
- **Whop.com** — Content gating for PDF exporter (wholesale-purchase-agreement-export)

### Media
- **Mux** — Video hosting/playback (biggerspreads)
- **Facebook Pixel** — Ad conversion tracking (biggerspreads, server-side via Paddle webhook)

### Local / Dev Tools (chief-workspace)
- **Trello API** — Base Camp board task management
- **Google Calendar API** — Due date sync
- **Whisper (local)** — Voice transcription
- **Playwright (local)** — Screenshots and HTML rendering

### NOT IN USE (confirmed)
- Apollo.io — appears ONLY in MCDCommand test mock (tests/mocks/apollo.ts); not in package.json, not in source

---

## Top Concerns (verified facts only)

1. **MCDCommand 10DLC STILL PENDING** — Twilio SMS is the core outreach channel. Switched to new account + new number (T.J. confirmed). .env.example comment saying "A2P 10DLC approved" is STALE from old account. Active blocking issue for the wholesaling operation.

2. **MCDCommand service count mismatch** — CLAUDE.md says "12 services" but Procfile (verified) shows 4 app processes + 2 managed plugins = 6. T.J. estimates ~7. Discrepancy not explained; may indicate additional Railway services configured outside Procfile (e.g., cron worker, Telegram notifier). Needs clarification.

3. **Vigil/Sentinel compliance agent = UNIMPLEMENTED** — Explicitly documented as "registry entry only" in MCDCommand CLAUDE.md. All compliance is ad-hoc via dnc-guard/opt-out-detector. Potential legal exposure if Twilio messages violate TCPA without a proper compliance layer.

4. **marc-execution-layer may still be running on Railway** — Predecessor system (BTCC, not Hyperliquid). 0 commits since Feb 19. If still deployed, it's burning Railway credits for nothing.

5. **chief-workspace backup commits stopped Mar 22** — Daily automated backups ran through Mar 21 then stopped completely. Either OpenClaw is down or Chief is no longer running. If the 6AM/5PM cron routines also stopped, T.J. is missing his daily briefings.

6. **biggerspreads Next.js version mismatch** — Audit v2 says "Next.js 15.5" but actual package.json in nextjs/ shows 15.1.11. Minor but worth correcting.

7. **agentsidehustle kill-clock not started** — products_listed: 0 per sprint-tracker.md. 14-day kill check doesn't begin until listings go live. Sprint 1 day 4/7 complete — if T.J. hasn't posted yet, the window is closing.

8. **3 empty/deleted repos** — purchase-agreement-exporter (no commits), whop-saas-building (deleted README), Lionmaker (.gitkeep only). These add noise to the account and should be deleted or repurposed.

---

## Questions for T.J. — Final List

### Trading / Marcus

1. Are all 4 Hyperliquid agent wallet sessions (LDN, NY, LC, ASIA) currently active and funded?

2. The aggression-promotion feature branch (feature/aggression-promotion) is visible in Marcusv2 — is the Telegram bot for aggression state changes configured and running?

3. How many subscribers are currently in the Autarkeia fan-out? Is anyone paying yet?

4. Are all tests passing in CI (Vitest for Marcusv2, Playwright for MCDCommand)?

5. marcusv3 and marcus-master-indicator both contain identical 13-library Pine Script v4 architectures. Which is canonical? Should one be archived? Are these intended to eventually replace the Marcusv2 sensor or is v4 an independent indicator?

6. The Marcusv2 sensor is pine/marcus_v2_sensor.pine. What Pine Script (if any) is still sending webhooks to the v1 system?

7. Are Pro ORB v7/v8 indicators separate sellable products? The indicators repo has a v7 file; marcus (v1) has v7/v8/v9. Are any of these published on TradingView for sale?

8. Marcusv2 PHASE-STATUS.md was last updated at v0.7.14, but package.json is at 0.8.34. Is the PHASE-STATUS doc just stale, or are there meaningful changes from 0.7.x to 0.8.x not captured?

9. ethers ^6.16.0 is in Marcusv2 dependencies — is this specifically for Hyperliquid wallet key operations, or is there a TradFi/spot trading integration underway?

10. Is marcus-execution-layer (BTCC predecessor) still deployed and running on Railway? If not, safe to shut down and archive?

### Motor City Deals

11. Is mcd-agent-org (6 Python agents, docker-compose) deployed anywhere, or was it an experiment abandoned in favor of MCDCommand's built-in agents?

12. Is mls-bot still being used for outreach to expired/withdrawn listings? MCDCommand's acquisition pipeline appears to have superseded it. Also: who is Ali Alshehmani (FROM_EMAIL=Ali@motorcitydeals.com in mls-bot README)?

13. Is the Whop-gated wholesale-purchase-agreement-export tool live on Whop.com and generating any revenue? MCDCommand already has built-in document generation — is this a separate standalone product?

14. Should the empty purchase-agreement-exporter repo be deleted? (No commits, no code — 409 error on git.)

15. CLAUDE.md says "12 services" on Railway but Procfile shows 4 app processes + 2 managed plugins = 6. What's the accurate current Railway service count for MCDCommand? Are there additional services not in the Procfile?

16. Is the Vigil/Sentinel compliance agent intentionally unimplemented long-term, or is it a gap that needs addressing for TCPA compliance?

### BiggerSpreads

17. Who is Thomas (thomasbranch — open PR #2 in biggerspreads since Nov 2025)? Developer, contractor, test account?

18. How many emails are on the BiggerSpreads waitlist? Is the Mailchimp list being nurtured while on hold?

19. June 2026 evaluation — what are the go/no-go criteria for BiggerSpreads? Revenue target, market validation, personal bandwidth?

20. Is biggerspreads.com currently live/deployed, or is the site purely in development?

### Agent Side Hustle / DPE

21. Has anything from agentsidehustle Sprint 1 been listed on Etsy or Gumroad? (sprint-tracker.md shows products_listed: 0 as of Apr 1.) The 14-day kill-check clock doesn't start until listings go live.

22. Has Sprint 2 started?

23. What is the DPE revenue target or kill metric? After 14 days on Etsy — what's the minimum sales threshold to continue?

24. Is Animal Family Frenzy deployed anywhere Aurelia can play it (Vercel or otherwise)?

### Trish / trishpaintsjoy

25. Is trishpaintsjoy.com live and accepting orders? Is Snipcart configured with real payment credentials? Are there any sales?

### Infrastructure / Other

26. What's in CRON_JOBS_DRAFT.md in chief-workspace? Are the scheduled routines (6AM morning brief, 5PM EOD wrap, Sunday memory promotion, Monday stale task scan) actually firing?

27. Chief stopped making daily backup commits after Mar 22. Is OpenClaw still running? Did something break?

28. What is the ai-business-survey for? Lead-gen for AI consulting services, or a specific product/offer? Where is it hosted? Does the survey capture submissions anywhere (no backend visible)?

29. Is polytrade actively trading on Polymarket with real money, or running in paper mode / was it a one-session experiment? Is it related to Marcusv2 in any way?

30. Why were all files deleted from whop-saas-building? Was it a Whop.com SaaS experiment that got abandoned? Should the repo be deleted?

31. What is the Lionmaker repo intended to be? The account handle is lionmaker11 — is this a placeholder for a brand/portfolio project? Should it be deleted?

32. Safe to archive/delete the following repos (no active use confirmed):
    - marcus-execution-layer (superseded by Marcusv2, BTCC-based)
    - marcus (v1) (superseded)
    - indicators (single PRO ORB v7 file, 0 activity)
    - real-estate-calculator (14-month-old JS prototype)
    - wholesale-purchase-agreement-export (1 initial commit, may be live — clarify first)
    - purchase-agreement-exporter (empty)
    - whop-saas-building (empty)
    - Lionmaker (empty)

---

**Total open questions: 32**

---

## Discrepancies Found in v2 Audit Files (corrections for the record)

| Repo | Audit v2 Claim | Verified Reality |
|---|---|---|
| biggerspreads | "Next.js 15.5" | package.json (nextjs/) shows 15.1.11 |
| MCDCommand | "12 services" per CLAUDE.md | Procfile: 4 app + 2 managed = 6 (CLAUDE.md is stale) |
| polytrade | "main (inferred from branch name)" | No main branch — only claude/trading-system-order-book-Op8mH |
| Marcusv2 | "100+ commits (at API limit)" | Exact count: 270 in 30 days |
| MCDCommand | "218 (100+100+18)" | Verified: 218 in 30 days — correct |
| trishpaintsjoy | Next.js version not specified | Actually Next.js 16.2.1 (notably higher than other repos) |

---

*Audit completed: 2026-04-03. Verified via gh CLI against live GitHub API.*

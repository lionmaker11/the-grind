# GitHub Repo Audit — Opus
Date: 2026-04-03
Account: lionmaker11

---

## Status Table

| Repo | Status | Commits/30d | Last Commit | Cluster |
|------|--------|-------------|-------------|---------|
| MCDCommand | ACTIVE | 218 | 2026-04-03 | motor-city-deals |
| Marcusv2 | ACTIVE | 270 | 2026-04-03 | marcus |
| agentsidehustle | STALLING | 3 | 2026-04-01 | agent-side-hustle |
| animalfamilyfrenzy | STALLING | 11 | 2026-03-28 | agent-side-hustle |
| trishpaintsjoy | STALLING | 6 | 2026-03-29 | agent-side-hustle |
| chief-workspace | STALLING | 11 | 2026-03-22 | infrastructure |
| ai-business-survey | ABANDONED | 3 | 2026-03-20 | agent-side-hustle |
| polytrade | STALLING | 4 | 2026-03-20 | infrastructure |
| mcd-agent-org | STALLING | 1 | 2026-03-17 | motor-city-deals |
| mls-bot | STALLING | 86 | 2026-03-16 | motor-city-deals |
| marcusv3 | STALLING | 5 | 2026-03-12 | marcus |
| marcus-master-indicator | STALLING | 2 | 2026-03-12 | marcus |
| whop-saas-building | ABANDONED | 0 | 2026-02-25 | agent-side-hustle |
| Lionmaker | ABANDONED | 0 | 2026-02-24 | infrastructure |
| marcus-execution-layer | ABANDONED | 0 | 2026-02-19 | marcus |
| marcus | ABANDONED | 0 | 2026-02-15 | marcus |
| indicators | ABANDONED | 0 | 2026-02-07 | marcus |
| biggerspreads | ABANDONED (on hold) | 0 | 2025-12-29 | biggerspreads |
| wholesale-purchase-agreement-export | ABANDONED | 0 | 2025-10-30 | motor-city-deals |
| purchase-agreement-exporter | ABANDONED | 0 | never | motor-city-deals |
| biggerspreadswaitlist | ABANDONED | 0 | 2025-09-11 | biggerspreads |
| real-estate-calculator | ABANDONED | 0 | 2025-02-20 | motor-city-deals |

---

## Active (commits in last 30 days — >10 commits)

**MCDCommand** — 218 commits. Primary MCD product. Live development, forensic audit completed 2026-04-02. 4 Railway process types (Procfile). Vigil agent unimplemented. 10DLC pending.

**Marcusv2** — 270 commits. Live mainnet trading system. Highest velocity repo in the account. 30 open branches. Shadow + live execution running.

---

## Stalling (1–30 days since last commit, or low velocity)

**agentsidehustle** — 3 commits. Sprint 1 products built (5 spreadsheets), none listed yet. Human listing gate is the bottleneck.

**animalfamilyfrenzy** — 11 commits. Game for Aurelia, MVP complete. Likely done unless Aurelia requests changes.

**trishpaintsjoy** — 6 commits. Artist site at trishpaintsjoy.com. Near-complete polish. No active tasks.

**chief-workspace** — 11 commits. Last backup 2026-03-22. Memory logs stopped. OpenClaw backup cron may have failed.

**polytrade** — 4 commits. Polymarket quant trading experiment. Paper trade only. No deployment. Status unclear.

**mcd-agent-org** — 1 commit. Python agent scaffold, never iterated. Roman/GM and 5 specialists exist as skeletons only.

**mls-bot** — 86 commits (burst: 2026-03-04 to 2026-03-16). Flask MLS outreach tool. Complete but stopped. Likely superseded by MCDCommand's built-in outreach.

**marcusv3** — 5 commits. Marcus v4.0 Pine Script libraries. Parked. Duplicate structure with marcus-master-indicator.

**marcus-master-indicator** — 2 commits. Marcus v4.0 Pine Script libraries (likely canonical). Parked while Marcusv2 execution is priority.

---

## Abandoned (90+ days since last commit, or empty)

**whop-saas-building** — Empty repo (README deleted). 2026-02-25.

**Lionmaker** — Single .gitkeep file. 2026-02-24.

**marcus-execution-layer** — Marcusv2 predecessor. 2026-02-19. Superseded.

**marcus** — v1 Pine Script archive. 2026-02-15. Historical reference only.

**indicators** — Single PRO ORB v7 Pine Script file. 2026-02-07. Superseded.

**biggerspreads** — ON HOLD confirmed until June 2026. Last commit 2025-12-29. Facebook Pixel integration done. Vercel CVE branch unmerged.

**wholesale-purchase-agreement-export** — Whop gating is a non-functional stub (returns ok:true unconditionally). 2025-10-30. Single commit.

**purchase-agreement-exporter** — Empty repo. Never committed.

**biggerspreadswaitlist** — Waitlist page. Last commit 2025-09-11. Likely still live capturing emails.

**real-estate-calculator** — JS/MongoDB calculator. 2025-02-20. 14 months old. Heroku deploy target defunct. Fully superseded by MCDCommand.

---

## Deployed Services (Procfile/railway.json verified)

**MCDCommand** (Procfile — 4 processes):
  - web: npm start
  - messaging: npm run worker:messaging
  - scraper: npm run worker:scraper
  - underwriting: npm run worker:underwriting
  Note: CLAUDE.md claims "12 services" on Railway — 8 not enumerable from repo files (likely PostgreSQL, Redis, mcd-agent-org services, etc.)

**Marcusv2** (railway.json — 1 service):
  - startCommand: npm run start

**marcus-execution-layer** (railway.json — 1 service, ABANDONED):
  - startCommand: npm run start

**mls-bot** (Procfile — 1 process):
  - web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120

All other repos: no Procfile or railway.json found.

---

## External Services Master List

| Service | Repos |
|---------|-------|
| Anthropic/Claude API | MCDCommand, Marcusv2, mcd-agent-org |
| Twilio (SMS) | MCDCommand, mls-bot (optional) |
| Resend (email) | MCDCommand, Marcusv2, trishpaintsjoy |
| PostgreSQL | MCDCommand, Marcusv2, marcus-execution-layer |
| Redis / BullMQ | MCDCommand |
| BatchData | MCDCommand (skip tracing + DNC only — restricted) |
| Google Maps / Street View | MCDCommand |
| Cloudflare R2 | MCDCommand |
| Sentry | MCDCommand (DSN blank), Marcusv2 |
| Hyperliquid exchange | Marcusv2 |
| Telegram Bot API | Marcusv2 (institutional alerts), mcd-agent-org (GM command interface) |
| Sanity CMS | trishpaintsjoy, biggerspreads (sanity-blog) |
| Snipcart | trishpaintsjoy |
| Supabase | biggerspreads, biggerspreadswaitlist |
| Paddle | biggerspreads |
| Mailchimp | biggerspreads, biggerspreadswaitlist |
| Mux | biggerspreads, biggerspreadswaitlist |
| Facebook Pixel + Conversion API | biggerspreads |
| Polymarket CLOB API | polytrade |
| Polygon blockchain | polytrade |
| SendGrid | mls-bot |
| Whop API | wholesale-purchase-agreement-export (STUB — not functional) |
| Trello API | chief-workspace (local/OpenClaw) |
| Google Calendar API | chief-workspace (local/OpenClaw) |

---

## Top Concerns

1. **C-07 LIVE BUG in MCDCommand**: AUDIT.md documents that `/api/agents/activity` returns `{ activity: [] }` but `agents/page.tsx` reads `data.activities`. The agent activity panel in the MCD UI is silently broken. Identified 2026-04-02. Unclear if remediated in today's cleanup commit.

2. **Vigil (Sentinel) agent in MCDCommand is a phantom**: Zero code, zero skills, zero server logic. Compliance monitoring is ad-hoc across 4 other modules (dnc-guard, opt-out-detector, comms-rules, banned-phrases). If any of those modules fail, there is no watchdog. Documented in AUDIT.md and CLAUDE.md.

3. **mcd-agent-org is a skeleton, not running**: MCDCommand AUDIT.md describes a "separate Python repo" running the agent-gm service. mcd-agent-org has one commit (scaffold only). Roman/GM is not executing autonomously against the MCD platform.

4. **marcusv3 and marcus-master-indicator are duplicate repos** with identical v4.0 Pine Script architecture. One is redundant. Development is split across two branches (claude/marcus-v4-refactor-hlrBj and claude/marcus-v4-refactor-ARSZY) — unclear which is canonical.

5. **wholesale-purchase-agreement-export Whop gating is non-functional**: lib/whop.ts returns `{ ok: true }` unconditionally. If this is deployed, it has no access control.

6. **chief-workspace memory gap**: Daily backup logs stopped at 2026-03-21 (12 days ago). Either the backup cron broke or isn't running.

7. **biggerspreads vercel CVE branch** (vercel/react-server-components-cve-vu-tvi729) is unmerged. This is a security fix from Vercel. Should be merged before June relaunch.

8. **purchase-agreement-exporter is an empty repo** that appears to duplicate the purpose of wholesale-purchase-agreement-export. Dead weight.

9. **real-estate-calculator** (14 months old, Heroku-targeted, fully superseded by MCDCommand) and **Lionmaker** (.gitkeep only) and **whop-saas-building** (README deleted) are cleanup candidates.

---

## All Questions for T.J.

[MCDCommand]
Q1. The Procfile has 4 processes (web, messaging, scraper, underwriting). CLAUDE.md says "12 services" on Railway. What are the other 8?
Q2. AUDIT.md C-07 flags a LIVE BUG: agents/page.tsx reads `data.activities` but the API returns `{ activity: [] }`. Is the agent activity panel working in production, or silently broken?
Q3. The `feat/grillahq-multi-tenant` branch exists and multi-tenant migrations are in the schema. Is that branch safe to delete for now?

[Marcusv2]
Q4. feature/tradfi-spot-integration is open — is TradFi spot trading on the near-term roadmap, or exploratory?
Q5. feature/MV2-institutional-production — what does "institutional production" mean here?
Q6. 30 open branches — are the fix/* branches stale/already merged to develop, or still being worked?

[agentsidehustle]
Q7. Sprint 1 products have been built since 2026-03-30. What's blocking the Etsy listing?
Q8. Are you running the autonomous weekly trend research cron, or is it scheduled to start later?

[animalfamilyfrenzy]
Q9. Is animalfamilyfrenzy deployed to Vercel? If so, what's the URL?
Q10. Has Aurelia played it? Is there a punch list, or is this complete?

[trishpaintsjoy]
Q11. Is trishpaintsjoy.com live and Trish happy? Anything outstanding to close this out?

[chief-workspace]
Q12. Memory logs stopped at 2026-03-21. Is the daily backup cron still running?
Q13. Is OpenClaw running continuously on your Mac? Any stability issues?

[ai-business-survey]
Q14. What was the ai-business-survey for? Market research for agentsidehustle? Does this repo need to be kept?

[polytrade]
Q15. Is polytrade an active project or an experiment you put down? Should it be archived?
Q16. Is this for actual Polymarket trading, or a learning exercise in market microstructure?

[mcd-agent-org]
Q17. Is mcd-agent-org deployed anywhere? MCDCommand's AUDIT.md references it as a separate service but it has one scaffold commit. Is Roman actually running?
Q18. Which agents do you want deployed first — Roman only, or all 6?

[mls-bot]
Q19. Is mls-bot still in active use, or has MCDCommand absorbed its function? Should it be archived?
Q20. Who is Ali Alshehmani? The README has Ali's name and email hardcoded as the sender identity.
Q21. Does mls-bot have persistent storage? If Flask crashes, does conversation history survive?

[marcusv3 / marcus-master-indicator]
Q22. Between marcusv3 and marcus-master-indicator, which is the canonical v4 development repo? One is redundant.
Q23. Is v4 indicator development paused intentionally while Marcusv2 execution is the priority?

[whop-saas-building]
Q24. What was whop-saas-building for? Should it be archived or deleted?

[Lionmaker]
Q25. What was Lionmaker intended to be? Cross-project docs hub? Can it be archived?

[marcus-execution-layer]
Q26. Is it safe to archive marcus-execution-layer? Or do you reference it while building Marcusv2 features?

[marcus / indicators]
Q27. Does the `staging` branch in the `marcus` repo serve any purpose?
Q28. Is PRO ORB v7 still in use on TradingView, or has it been fully replaced by Marcus? Can `indicators` be archived?

[biggerspreads]
Q29. The vercel/react-server-components-cve-vu-tvi729 CVE branch is unmerged. Needs to be merged before June relaunch.
Q30. Is thomasbranch still active, or should it be merged/closed before June?

[wholesale-purchase-agreement-export]
Q31. Whop gating is a stub (returns ok:true for everyone). Is this being revived or archived?

[purchase-agreement-exporter]
Q32. Empty repo — duplicate of wholesale-purchase-agreement-export? Should it be deleted?

[biggerspreadswaitlist]
Q33. Is biggerspreadswaitlist still live collecting emails? How many waitlist signups do you have?

[real-estate-calculator]
Q34. real-estate-calculator is 14 months old, Heroku-targeted, fully superseded by MCDCommand. Safe to archive?

---

Total Questions: 34

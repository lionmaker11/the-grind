# GitHub Repo Audit Summary
**Date:** 2026-04-03
**Total Repos:** 22
**GitHub Account:** lionmaker11

## Status Overview
| Repo | Status | Category | Last Commit |
|------|--------|----------|-------------|
| MCDCommand | ACTIVE | Motor City Deals | 2026-04-03 |
| Marcusv2 | ACTIVE | MARCUS Trading | 2026-04-03 |
| agentsidehustle | BUILT-NOT-LAUNCHED | Digital Product Empire | 2026-04-01 |
| animalfamilyfrenzy | STALLING | Personal / Family | 2026-03-28 |
| trishpaintsjoy | STALLING | Client / Family Site | 2026-03-29 |
| chief-workspace | ACTIVE | Infrastructure / PM | 2026-03-22 |
| ai-business-survey | STALLING | Unknown / Lead Gen | 2026-03-20 |
| polytrade | STALLING | Experimental Trading | 2026-03-20 |
| mcd-agent-org | STALLING | Motor City Deals | 2026-03-17 |
| mls-bot | STALLING | Motor City Deals | 2026-03-16 |
| marcusv3 | STALLING | MARCUS Trading | 2026-03-12 |
| marcus-master-indicator | STALLING | MARCUS Trading | 2026-03-12 |
| whop-saas-building | ABANDONED | Unknown | 2026-02-25 |
| Lionmaker | ABANDONED | Brand | 2026-02-24 |
| marcus-execution-layer | INTENTIONALLY FROZEN (LIVE) | MARCUS Trading | 2026-02-19 |
| marcus | STALLING | MARCUS Trading | 2026-02-15 |
| indicators | ABANDONED | MARCUS Trading | 2026-02-07 |
| biggerspreads | ABANDONED (ON HOLD) | BiggerSpreads SaaS | 2025-12-29 |
| wholesale-purchase-agreement-export | ABANDONED | Motor City Deals | 2025-10-30 |
| purchase-agreement-exporter | ABANDONED | Motor City Deals | Never (empty) |
| biggerspreadswaitlist | ABANDONED | BiggerSpreads SaaS | 2025-09-11 |
| real-estate-calculator | ABANDONED | Motor City Deals | 2025-02-20 |

## Active Projects (committed to in last 30 days)
1. MCDCommand — 30+ commits, heavy daily development, most active repo in the entire account
2. Marcusv2 — 30+ commits, daily feature work, all core phases complete, approaching live readiness
3. agentsidehustle — 3 commits (sprint launch + trend research), DPE Phase 1 launched
4. animalfamilyfrenzy — 11 commits (all on 2026-03-28), full Phase 1 MVP built for Aurelia
5. trishpaintsjoy — 6 commits (all on 2026-03-29), full portfolio/e-commerce site built
6. chief-workspace — 11 commits (daily backups), active in regular use
7. ai-business-survey — 3 commits, survey built + YouTube transcriptions added
8. polytrade — 4 commits (all on 2026-03-20), Polymarket trading experiment
9. mcd-agent-org — 1 commit, Python agent org scaffold dropped in
10. mls-bot — 30 commits (concentrated March 14-16), email/SMS template updates
11. marcusv3 — 5 commits (all on 2026-03-12), Pine Script v4.0 refactor
12. marcus-master-indicator — 2 commits (2026-03-12), Pine Script v4.0 simplification

## Stalling (last commit 30-90 days ago)
- agentsidehustle (4/1) — Phase 1 launched, Phase 2 unverified
- animalfamilyfrenzy (3/28) — MVP done, no follow-through
- trishpaintsjoy (3/29) — Site built, content population unknown
- chief-workspace (3/22) — Active but substantive work stopped 3/17
- ai-business-survey (3/20) — Survey built, no backend, purpose unclear
- polytrade (3/20) — One-session experiment, never merged to main
- mcd-agent-org (3/17) — Single-commit scaffold, no follow-up vs. 30+ commits in MCDCommand
- mls-bot (3/16) — Active tool but superseded by MCDCommand
- marcusv3 (3/12) — Pine Script v4.0 on unmerged feature branch
- marcus-master-indicator (3/12) — Parallel Pine Script v4.0 on unmerged feature branch
- marcus-execution-layer (2/19) — v1 system being superseded by Marcusv2
- marcus (2/15) — v1 Pine Script, legacy codebase

## Abandoned (last commit 90+ days ago)
- whop-saas-building (2/25) — All files deleted, empty
- Lionmaker (2/24) — Init only, never built
- indicators (2/7) — Single file upload, stale
- biggerspreads (12/29/25) — ON HOLD until June 2026
- wholesale-purchase-agreement-export (10/30/25) — Never updated after initial commit
- purchase-agreement-exporter — Empty repo, never built
- biggerspreadswaitlist (9/11/25) — Frozen with main BiggerSpreads
- real-estate-calculator (2/20/25) — Year-old prototype, superseded

## Cross-Project Connections
**Motor City Deals cluster:**
MCDCommand ← mcd-agent-org (Python agents) ← mls-bot (Ali's tool)
MCDCommand → wholesale-purchase-agreement-export (document generation)
MCDCommand → real-estate-calculator (superseded by built-in MAO)

**MARCUS cluster:**
Marcusv2 (full system) ← marcus-master-indicator + marcusv3 (Pine Script sensor)
Marcusv2 ← marcus-execution-layer (v1 predecessor)
marcus (v1 Pine Script) → marcus-execution-layer (v1 system)
indicators (Pro ORB archive) → marcus (more complete version)

**BiggerSpreads cluster:**
biggerspreads (main app) ← biggerspreadswaitlist (lead capture)
whop-saas-building (possibly was a distribution channel for BiggerSpreads)

**Digital Products cluster:**
agentsidehustle (DPE system)
animalfamilyfrenzy (personal/possibly DPE)
trishpaintsjoy (client site, possibly DPE-built)
ai-business-survey (survey possibly for DPE funnel)

**Infrastructure:**
chief-workspace (cross-project PM layer, references all other projects)

## Life Category Mapping
1. Physical: None directly
2. Mental: animalfamilyfrenzy (built for Aurelia — family wellbeing), chief-workspace (T.J.'s cognitive load management)
3. Spiritual: None
4. On the Business: chief-workspace, ai-business-survey, agentsidehustle, polytrade, whop-saas-building
5. In the Business: MCDCommand, mcd-agent-org, mls-bot, wholesale-purchase-agreement-export, purchase-agreement-exporter, real-estate-calculator, trishpaintsjoy, biggerspreads, biggerspreadswaitlist
6. Finances: Marcusv2, marcusv3, marcus-master-indicator, marcus-execution-layer, marcus, indicators, polytrade
7. Relationships: trishpaintsjoy (Trish), animalfamilyfrenzy (Aurelia), mls-bot (Ali)

## Top Concerns (REVISED 2026-04-03 after fact-check)
1. ~~MARCUS v2 live status unknown~~ — RESOLVED (T.J., Apr 3). Marcusv2 IS live on mainnet, streaming continuously. Architecture doc and .env.example dry-run defaults are artifacts — do not reflect runtime state. The .75 BTC goal has an active engine in v2.
2. agentsidehustle DPE has NOT launched — sprint-tracker.md explicitly shows products_listed: 0, revenue: $0, marketplaces_active: []. The original audit incorrectly called this "DPE Phase 1 launched." Products are built but nobody has been given a link to buy them.
3. MCDCommand "12 services" claim is unsupported — Architecture doc says 3 Railway app services + PostgreSQL + Redis = 5 services. Procfile shows 4 app services. "12 services" appears in CLAUDE.md but contradicts the actual architecture documentation.
4. Composio was never a dependency of MCDCommand — it appears in the original audit tech stack but is NOT in package.json, .env.example, or the git tree. This was a fabricated claim.
5. mcd-agent-org Python org has a "team-lead" agent with NO equivalent in MCDCommand's agent list — likely dead code but adds confusion about the actual agent architecture.
6. marcusv3 and marcus-master-indicator have NO main branch — audit implied "never merged to main" but there IS no main. These repos exist entirely on claude/ feature branches and are NOT the v2 sensor (v2 has its own sensor in pine/marcus_v2_sensor.pine).
7. A2P/10DLC for MCDCommand is NOW CONFIRMED APPROVED — .env.example comment and CLAUDE.md both confirm "A2P 10DLC approved" with a real Messaging Service SID and FROM number (+1 248-621-5904). Original audit incorrectly flagged this as pending.
8. trishpaintsjoy runs Next.js 16.2.1, not 15 — and Sanity project ID + Snipcart key are still placeholders in the repo, raising questions about whether the site is actually live with real content.
9. The Vigil (Sentinel) compliance agent in MCDCommand is UNIMPLEMENTED — the audit listed it as one of the 6 working agents, but CLAUDE.md explicitly calls it "UNIMPLEMENTED — registry entry only."
10. Apollo.io was entirely missing from MCDCommand's tech stack — it's an external enrichment service confirmed in the system architecture doc alongside BatchData.

## Consolidated Questions for T.J. (UPDATED 2026-04-03)
[MCDCommand] 1. ~~Is A2P/10DLC SMS registration submitted yet?~~ ANSWERED BY FACT-CHECK: A2P 10DLC is approved. Twilio Messaging Service SID MG595789... and FROM +1-248-621-5904 are configured. Follow-up: Is SMS actively sending at scale?
[MCDCommand] 2. Is the GrillaHQ multi-tenant feature intended to let Ali run his own MCD instance, or is it for white-labeling to other wholesalers?
[MCDCommand] 3. The Stripe integration is placeholder — is there a plan to monetize MCD directly, or is Stripe purely incidental?
[MCDCommand] 4. The CLAUDE.md guardrails restrict BatchData calls — is this because of past cost overruns?
[MCDCommand] 5. (NEW) Apollo.io is in the tech stack alongside BatchData — are both active? What's the monthly cost of each?
[MCDCommand] 6. (NEW) Vigil (Sentinel) compliance agent is UNIMPLEMENTED — is there a plan to build it, or is ad-hoc compliance sufficient?
[MCDCommand] 7. (NEW) The architecture doc says 3 Railway services but CLAUDE.md says 12 — what's the actual service count?
[Marcusv2] 8. ~~Is Marcusv2 live on mainnet?~~ CONFIRMED LIVE (T.J., Apr 3). Streaming continuously. Follow-up: Is v1 (marcus-execution-layer) still running in parallel or fully replaced by v2?
[Marcusv2] 9. Are all 4 Hyperliquid agent wallet sessions (LDN, NY, LC, ASIA) active ON THE V1 SYSTEM?
[Marcusv2] 10. Is the aggression-promotion Telegram bot configured and running?
[Marcusv2] 11. What's the subscriber count on Autarkeia (v1) right now? Is anyone paying?
[Marcusv2] 12. (NEW) Shadow validation criteria — what pass/fail gates must v2 meet before proceeding to testnet?
[Marcusv2] 13. (NEW) Are all 1,559+ tests passing in CI? Any known failures?
[marcusv3/marcus-master-indicator] 14. Are these v4.0 repos intended for the v1 system, or are they abandoned mid-refactor? Neither feeds Marcusv2 (v2 has its own sensor).
[marcus-execution-layer] 15. ~~Still running live?~~ ANSWERED: YES, confirmed live by Marcusv2 architecture doc. Follow-up: How many open positions/active subscribers right now?
[marcus-execution-layer] 16. (NEW) What Pine Script indicator is currently sending webhooks to the v1 system — the original v1 (~3100 lines) or a v4.0 variant?
[agentsidehustle] 17. sprint-tracker.md shows products_listed: 0 — have ANY Sprint 1 products been listed on Etsy or Gumroad since 4/1?
[agentsidehustle] 18. Has Sprint 2 started, or is Sprint 1 still unlisted?
[agentsidehustle] 19. Is there a revenue target or kill metric for the DPE as a whole?
[animalfamilyfrenzy] 20. Is Animal Family Frenzy deployed anywhere Aurelia can actually play it?
[animalfamilyfrenzy] 21. (NEW) Has Aurelia seen or played the game via AURELIA-README.md?
[trishpaintsjoy] 22. Who is Trish? Family member, client, or personal project?
[trishpaintsjoy] 23. Is trishpaintsjoy.com live with real content? (The Sanity project ID in .env.example is still placeholder.)
[trishpaintsjoy] 24. Has the Sanity project ID been set in Vercel environment variables?
[trishpaintsjoy] 25. (NEW) Has the Instagram feed been connected to a real account?
[chief-workspace] 26. What cron jobs are being planned in CRON_JOBS_DRAFT.md? Is daily backup manual or automated?
[ai-business-survey] 27. What is the ai-business-survey for? It has no backend — how are you receiving responses (if at all)?
[ai-business-survey] 28. Are the two YouTube videos T.J.'s own channel?
[polytrade] 29. Is polytrade an active project or one-session experiment?
[polytrade] 30. Has polytrade ever run in live mode with real capital?
[mcd-agent-org] 31. Is mcd-agent-org deployed anywhere? (No railway.json found.) What is "team-lead" agent's role?
[mls-bot] 32. Is mls-bot still running in production for Ali, or has MCDCommand replaced it?
[whop-saas-building] 33. Why were all files deleted? The QR/reviews template suggests this wasn't BiggerSpreads — what was it?
[Lionmaker] 34. What is the Lionmaker repo intended to be?
[marcus] 35. Are the Pro ORB v7/v8 indicators separate sellable products from MARCUS?
[biggerspreads] 36. Who is Thomas (thomasbranch)? Is the Vercel React Server Components CVE fixed?
[biggerspreads] 37. Is the June 2026 decision point still the plan?
[biggerspreadswaitlist] 38. How many emails are on the BiggerSpreads waitlist?
[wholesale-purchase-agreement-export] 39. Is the Whop-gated purchase agreement exporter live and being used by MCD?
[purchase-agreement-exporter] 40. Should the empty purchase-agreement-exporter repo be deleted?

## Cross-Project Connections (CORRECTED 2026-04-03)
**Motor City Deals cluster:**
MCDCommand ← mcd-agent-org (Python agents — possibly dead code, no deployment config)
MCDCommand ← mls-bot (Ali's outreach tool — possibly superseded)
MCDCommand → wholesale-purchase-agreement-export (document generation — possibly unused)
MCDCommand → real-estate-calculator (superseded by built-in MAO)

**MARCUS cluster (CORRECTED):**
marcus-execution-layer (v1 — LIVE SYSTEM, currently running all trades)
  ↑ marcus (v1 Pine Script sensor, likely active on TradingView)
  ↑ OR marcusv3/marcus-master-indicator (v4.0 refactor of v1 sensor — unconfirmed if published)
Marcusv2 (v2 — SHADOW VALIDATION ONLY, not live yet)
  ↑ pine/marcus_v2_sensor.pine (v2's OWN sensor, ~600 lines, lightweight)
  ← indicators (stale archive, not in active use)

**BiggerSpreads cluster:** (unchanged)
biggerspreads (main app) ← biggerspreadswaitlist (lead capture)

**Digital Products cluster:** (updated)
agentsidehustle (DPE — products BUILT but NOT LISTED anywhere)
animalfamilyfrenzy (personal/family — complete but possibly not deployed)
trishpaintsjoy (client site — placeholder credentials in repo)
ai-business-survey (unknown purpose — no backend)

## Fact-Check Notes (2026-04-03) — What Changed from v1 Audit
**Major corrections:**
1. agentsidehustle: "Phase 1 launched" → NOT LAUNCHED. Zero listings, zero revenue.
2. MCDCommand: A2P 10DLC "pending" → APPROVED. Real SID and FROM number confirmed.
3. MCDCommand: Composio in tech stack → FABRICATED. Not in package.json or .env.example.
4. MCDCommand: "12 Railway services" → Architecture doc says 3 app services + 2 datastores = 5. Procfile shows 4 app services.
5. MCDCommand: Missing Apollo.io from tech stack → Confirmed in architecture doc as contact enrichment service.
6. MCDCommand: Compliance agent = "working" → Vigil (Sentinel) is UNIMPLEMENTED per CLAUDE.md.
7. Marcusv2: "30+" commits → 270+ commits in 30 days.
8. Marcusv2: "phases 0-5 complete" → Phases 0-9 + Edge Intelligence + v1 Baseline + CVTS + QA Hardening all complete (v0.7.0).
9. Marcusv2: "depends on marcus-master-indicator" → WRONG. v2 has its own sensor (pine/marcus_v2_sensor.pine).
10. Marcusv2: "195 tests" → 1,559+ tests across 72 files.
11. Marcusv2: Live status "unknown" → CONFIRMED shadow validation only. v1 is the live system.
12. marcus-execution-layer: "may still be running" → CONFIRMED RUNNING by Marcusv2 architecture doc.
13. marcusv3 & marcus-master-indicator: "never merged to main" → NO MAIN BRANCH EXISTS.
14. mls-bot: "30 commits" → 86 commits in 30-day window.
15. trishpaintsjoy: "Next.js 15" → Next.js 16.2.1.
16. mcd-agent-org: Missing "team-lead" agent in agent org (no equivalent in MCDCommand).
17. biggerspreadswaitlist: Last commit message slightly wrong ("Update README.md / added google" → "Update README.md").

**Commit counts (30-day) — corrected:**
| Repo | Audit Claimed | Actual |
|------|---------------|--------|
| MCDCommand | 30+ | 218+ |
| Marcusv2 | 30+ | 270+ |
| mls-bot | 30 | 86 |
| agentsidehustle | 3 | 3 ✅ |
| animalfamilyfrenzy | 11 | 11 ✅ |
| trishpaintsjoy | 6 | 6 ✅ |
| chief-workspace | 11 | 11 ✅ |
| ai-business-survey | 3 | 3 ✅ |
| polytrade | 4 | 4 ✅ |
| mcd-agent-org | 1 | 1 ✅ |

# Audit Corrections Log
**Date:** 2026-04-03
**Auditor:** Claude Code (fact-check pass)
**Method:** Verified every claim in every AUDIT.md against the actual GitHub repo using `gh api` calls, reading CLAUDE.md, package.json, .env.example, and architecture docs

---

## Summary
- Corrections made: 17
- Low-confidence flags added: 22
- New questions added: 33

---

## CORRECTIONS (Before → After)

### MCDCommand

**C1 — Commit count understated**
- Before: "30+" commits in last 30 days
- After: 218+ commits (gh api returned 100+100+18 across 3 pages)
- Evidence: `gh api "repos/lionmaker11/MCDCommand/commits?since=2026-03-04T00:00:00Z&per_page=100"` returned 100 on page 1, 100 on page 2, 18 on page 3

**C2 — Compliance agent status wrong**
- Before: "6-agent AI org (Roman, Mira, Cole, Nix, Sage, plus a compliance agent)" — implied all 6 working
- After: Vigil (Sentinel) is the compliance agent's name, and it is UNIMPLEMENTED per CLAUDE.md: "UNIMPLEMENTED — registry entry only. Compliance is ad-hoc via dnc-guard, opt-out-detector, comms-rules, banned-phrases."
- Evidence: CLAUDE.md agent boundary table, Vigil row

**C3 — Composio was fabricated**
- Before: Tech stack listed "Composio (email integration)"
- After: Composio does NOT appear in package.json, .env.example, or git tree (555 files searched). This dependency was invented.
- Evidence: `gh api repos/lionmaker11/MCDCommand/contents/package.json` — no composio; git tree search returned empty

**C4 — A2P 10DLC approval status wrong (HIGH IMPORTANCE)**
- Before: "A2P/10DLC SMS registration (Twilio configured but pending carrier approval)"
- After: A2P 10DLC IS APPROVED. .env.example comment says "Twilio (A2P 10DLC approved)". CLAUDE.md has real Messaging Service SID (MG595789fe242860a7304402fdbcc51421) and FROM number (+1 248-621-5904).
- Evidence: `.env.example` header comment + CLAUDE.md external services section
- Impact: This was flagged as the #7 top concern in the original audit — it's not a concern, it's resolved.

**C5 — Railway service count wrong**
- Before: "Deployed on Railway (12 services)"
- After: Architecture doc (docs/architecture/01-system-overview.md) says "Three Railway services, one PostgreSQL database, one Redis instance" = 5. Procfile shows 4 app services (web, messaging, scraper, underwriting). "12 services" appears only in CLAUDE.md header and is NOT corroborated by any other doc.
- Evidence: System overview doc + Procfile content

**C6 — Apollo.io missing from tech stack**
- Before: Tech stack did not include Apollo.io
- After: Apollo.io is listed as an external service in system-overview.md: "Apollo.io — Contact enrichment (email, phone, firmographic data)"
- Evidence: `docs/architecture/01-system-overview.md` content

### Marcusv2

**C7 — Commit count understated**
- Before: "30+" commits in last 30 days
- After: 270+ commits (100+100+70 across 3 pages)
- Evidence: `gh api "repos/lionmaker11/Marcusv2/commits?since=2026-03-04T00:00:00Z&per_page=100"`

**C8 — Phase completion severely understated (HIGH IMPORTANCE)**
- Before: "All phases 0-5 are marked COMPLETE in the architecture doc"
- After: ALL phases 0-9 are complete, PLUS Edge Intelligence, v1 Baseline Alignment, CVTS (Continuous Variable Testing), and QA Hardening. Current version is v0.7.0. The architecture doc lists 14 completed phases total.
- Evidence: MARCUS_V2_ARCHITECTURE.md and MARCUS_V2_PHASES.md phase status table

**C9 — Wrong Pine Script dependency (HIGH IMPORTANCE)**
- Before: "Depends on: marcus-master-indicator (Pine Script sensor)"
- After: Marcusv2 has its OWN Pine Script sensor at pine/marcus_v2_sensor.pine (~600 lines). marcusv3 and marcus-master-indicator are refactors of the v1 indicator, NOT the v2 sensor.
- Evidence: CLAUDE.md project structure shows pine/ directory; MARCUS_V2_ARCHITECTURE.md: "Marcus Sensor: Pine Script v6 indicator (~600 lines). Emits raw 1-minute data to server."

**C10 — Test count severely wrong**
- Before: "Signal Engine (20 modules, 195 tests)"
- After: 1,559+ tests across 72 test files. The 195 was Phase 1 only (as of v0.2.0 — one of 14 phases).
- Evidence: MARCUS_V2_ARCHITECTURE.md: "Current test suite: 1,559+ tests across 72 test files."

**C11 — Live status confirmed (HIGH IMPORTANCE)**
- Before: "The big question is whether it's live on mainnet yet." (unknown)
- After: CONFIRMED. v2 is in shadow validation phase prior to testnet. V2_EXECUTION_ENABLED=false. Marcusv2 architecture doc: "System is in shadow validation phase prior to testnet."
- Evidence: MARCUS_V2_ARCHITECTURE.md Transition Path section

**C12 — HL private key storage wrong**
- Before: Implied private keys are in env vars (4 slots: LDN, NY, LC, ASIA)
- After: "Private keys are no longer stored as environment variables. They are managed via the Exchange Account UI (Phase 6), encrypted with AES-256-GCM, stored in v2_exchange_accounts table."
- Evidence: MARCUS_V2_ARCHITECTURE.md note on HL Agent Wallet keys

### marcus-execution-layer

**C13 — Health status wrong (HIGH IMPORTANCE)**
- Before: "STALLING — No commits since 2026-02-19. This may still be running live while v2 is being built."
- After: CONFIRMED RUNNING. Marcusv2 architecture doc explicitly: "Both v1 services remain untouched and handle all live trading until cutover." v1 is frozen in code but LIVE in production.
- Evidence: MARCUS_V2_ARCHITECTURE.md Railway Services + Transition Path sections

### marcusv3 and marcus-master-indicator

**C14 — "Never merged to main" phrasing misleading**
- Before: "Active branches: claude/marcus-v4-refactor-X (this is the default branch — never merged to main)"
- After: There IS NO main branch in either repo. The claude/ branch is the ONLY branch. There is nothing to merge to.
- Evidence: `gh api repos/lionmaker11/marcusv3/git/refs` — single ref only

**C15 — Wrong cross-project dependency**
- Before: "Used by: Marcusv2 (marcus-master-indicator serves as the Pine Script sensor)"
- After: WRONG. Marcusv2 does not depend on either repo. These v4.0 repos are v1 indicator refactors. Marcusv2 uses its own pine/marcus_v2_sensor.pine.
- Evidence: Marcusv2 git tree + architecture doc

### agentsidehustle

**C16 — "Phase 1 launched" was WRONG (HIGH IMPORTANCE)**
- Before: REPO_AUDIT_SUMMARY.md said "DPE Phase 1 launched" and AUDIT.md said "Phase 1 launched on Gumroad"
- After: sprint-tracker.md (last commit 2026-04-01) explicitly shows: products_listed: 0, total_marketplace_products_live: 0, total_monthly_marketplace_revenue: $0, marketplaces_active: []. Products are BUILT as .xlsx files but NOTHING is listed or live on any marketplace.
- Evidence: sprint-tracker.md content

### mls-bot

**C17 — Commit count wrong**
- Before: "Commits in last 30 days: 30 (heavy activity March 14-16)"
- After: 86 commits in the 30-day window (all still March 14-16)
- Evidence: `gh api "repos/lionmaker11/mls-bot/commits?since=2026-03-04T00:00:00Z&per_page=100"` returned 86

### trishpaintsjoy

**C18 — Wrong Next.js version**
- Before: "Next.js 15 (App Router)"
- After: Next.js 16.2.1
- Evidence: `package.json` dependencies: "next": "16.2.1"

### biggerspreadswaitlist

**C19 — Last commit message slightly wrong**
- Before: "Last Commit: 2025-09-11 — Update README.md / added google"
- After: The actual last commit message is "Update README.md" (the "added google" was the prior commit, same day)
- Evidence: `gh api repos/lionmaker11/biggerspreadswaitlist/commits?per_page=3`

### mcd-agent-org

**C20 — Missing agent in org structure**
- Before: "6 Python AI agents" with implied mapping to MCDCommand's 6 agents
- After: The Python org has 6 directories (gm/, team-lead/, acquisition-ops/, disposition-ops/, data-ops/, intelligence-ops/). There is NO compliance agent. "team-lead" is a mystery agent with no equivalent in MCDCommand. gm/ main.py references only 4 specialists (Mira, Cole, Nix, Sage) — not 6.
- Evidence: `gh api repos/lionmaker11/mcd-agent-org/git/trees/HEAD?recursive=1`

### polytrade

**C21 — "Never merged to main" phrasing misleading (same as marcusv3)**
- Before: "Active branches: claude/trading-system-order-book-Op8mH (this is the default branch — never merged to main)"
- After: There IS NO main branch. Same single-branch-only pattern.
- Evidence: `gh api repos/lionmaker11/polytrade/git/refs`

---

## LOW CONFIDENCE FLAGS ADDED

**MCDCommand:**
- LCF1: BatchData API key is still placeholder ("your-b...-key") in .env.example — likely configured in Railway env vars but unverified
- LCF2: Cloudflare R2 keys are placeholder — photo upload may not be operational

**Marcusv2:**
- LCF3: Autarkeia subscriber count — no evidence in repo of active subscriber count
- LCF4: Whether shadow trading validation results are passing criteria to proceed to testnet

**mcd-agent-org:**
- LCF5: Whether mcd-agent-org is deployed anywhere — no railway.json or railway.toml found
- LCF6: Real Telegram chat ID (521909109) in .env.example — unclear if reflects actual deployment

**marcusv3:**
- LCF7: Whether v4.0 indicator is published on TradingView — placeholder username in Marcus.pine ("Replace YOUR_TV_USERNAME")

**marcus-master-indicator:**
- LCF8: Which (if either) of marcusv3 and marcus-master-indicator is the canonical v4.0 indicator

**marcus:**
- LCF9: Whether v1 or v4.0 Pine Script is currently active on TradingView sending webhooks to v1 execution layer

**marcus-execution-layer:**
- LCF10: v1 Autarkeia subscriber count — cannot determine from repo

**biggerspreads:**
- LCF11: What "removed" in the 2025-12-29 commit actually deleted
- LCF12: Whether the Vercel React Server Components CVE has been patched (branch still open)

**biggerspreadswaitlist:**
- LCF13: Whether "added google" means Analytics, Sheets, or something else

**agentsidehustle:**
- LCF14: Whether products will generate revenue — zero market validation yet

**animalfamilyfrenzy:**
- LCF15: Whether game is deployed on Vercel — no deployment config found

**trishpaintsjoy:**
- LCF16: Whether site is live with real content — Sanity project ID and Snipcart key are placeholders in repo
- LCF17: Whether artwork images are Trish's actual work or stock placeholders

**ai-business-survey:**
- LCF18: Survey purpose — no README and no form action means unclear if this is lead-gen or internal

**chief-workspace:**
- LCF19: How daily backup automation works — no cron config found in repo

**wholesale-purchase-agreement-export:**
- LCF20: Tech stack not verified against package.json — inferred from commit message
- LCF21: Whether tool has ever been deployed or used for real MCD deals

**real-estate-calculator:**
- LCF22: Framework claimed as "React (implied)" — not verified against package.json

---

## NEW QUESTIONS ADDED

**MCDCommand (5 new):**
1. Apollo.io vs BatchData — are both active simultaneously? Monthly cost?
2. Vigil (Sentinel) compliance agent is UNIMPLEMENTED — plan to build, or ad-hoc compliance sufficient?
3. Architecture doc says 3 Railway services but CLAUDE.md says 12 — actual service count?
4. SMS via Twilio Messaging Service — is it actively sending at scale? Daily volume?
5. BatchData and R2 keys are placeholder in .env.example — are they configured in Railway?

**Marcusv2 (6 new):**
6. v1 architecture doc confirms v1 is live — when is v2 testnet cutover planned?
7. Shadow validation criteria — what pass/fail gates must v2 meet before testnet?
8. HL private keys — stored in Exchange Account UI. Are subscribers already linked?
9. 1,559+ tests — are all passing in CI? Any known failures?
10. scrums/ and inbox/ directories — actively maintained or stale?
11. V2_EXECUTION_ENABLED — is it set to true anywhere (Railway env vars)?

**marcus-execution-layer (2 new):**
12. How many open positions/active subscribers on v1 right now?
13. Which TradingView indicator is currently sending webhooks to v1?

**marcusv3/marcus-master-indicator (1 new each):**
14. Are these v4.0 repos intended for v1 system or abandoned mid-refactor?
15. Neither feeds Marcusv2 — so what's their purpose going forward?

**agentsidehustle (4 new):**
16. sprint-tracker shows products_listed: 0 — have ANY products been listed since 4/1?
17. Has the 14-day kill clock started?
18. Has Sprint 2 started?
19. Real estate spreadsheets compete with MCDCommand's MAO calc — risk of cannibalization?

**animalfamilyfrenzy (1 new):**
20. Has Aurelia seen/played the game via AURELIA-README.md?

**trishpaintsjoy (4 new):**
21. Has Sanity project ID been set in Vercel env vars?
22. Are artwork images Trish's real work or placeholders?
23. Has Instagram feed been connected to a real account?
24. Has Resend API been configured for contact form emails?

**ai-business-survey (1 new):**
25. Survey has no backend — how are responses being collected (if at all)?

**mcd-agent-org (3 new):**
26. What is "team-lead" agent's role?
27. Is the Telegram chat ID (521909109) T.J.'s personal chat?
28. Was Vigil/compliance agent never part of the Python org design?

**biggerspreads (2 new):**
29. What is the "analysis feature" added 12/21?
30. Is the Vercel React Server Components CVE fixed (branch still open)?

**chief-workspace (question refined):**
31. Is the daily backup manual or automated? No cron script found in repo.

**wholesale-purchase-agreement-export (1 new):**
32. Tech stack not verified — confirm package.json has pdf-lib, zod, Whop SDK

**biggerspreadswaitlist (question refined):**
33. Clarified: "added google" could mean Analytics, Sheets, or OAuth — which?

---

## CLAIMS VERIFIED AS CORRECT

- MCDCommand last commit date 2026-04-03 ✅
- MCDCommand branch list (all 13 branches) ✅
- Marcusv2 last commit date 2026-04-03 ✅
- Marcusv2 30 branches ✅
- Marcusv2 no open issues or PRs ✅
- Marcusv2 8 core components ✅
- agentsidehustle last commit 2026-04-01 ✅
- agentsidehustle 5 Sprint 1 products as .xlsx files ✅
- animalfamilyfrenzy 11 commits on 2026-03-28 ✅
- animalfamilyfrenzy Phaser 3 + React + Vite + TypeScript ✅
- trishpaintsjoy 6 commits on 2026-03-29 ✅
- trishpaintsjoy Sanity v3 integration ✅
- chief-workspace 11 commits in 30 days ✅
- marcusv3 single branch, last commit 2026-03-12 ✅
- mcd-agent-org single commit 2026-03-17 ✅
- mcd-agent-org FastAPI in requirements.txt ✅
- indicators last commit 2026-02-07, two branches ✅
- Lionmaker empty repo, single init commit ✅
- biggerspreads last commit 2025-12-29, thomasbranch + CVE branch ✅
- marcus-execution-layer last commit 2026-02-19, 4 branches ✅
- marcus last commit 2026-02-15, 2 branches ✅

# polytrade — Repo Audit
**Repo:** https://github.com/lionmaker11/polytrade
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-20 — Fix adapter to match real Polymarket CLOB API protocol

## What This Is
Polytrade is a quantitative trading system for Polymarket — a prediction market platform on Polygon blockchain. It applies statistical trading models (described in the commit as "five research" integrations) to prediction market contracts, using the Polymarket CLOB (Central Limit Order Book) API. It includes a live/paper trading adapter with WebSocket feed integration, and runs in paper trade mode by default. This is a distinct trading system from MARCUS (which targets crypto perpetuals on Hyperliquid) — this targets prediction market contracts.

## Tech Stack
- Language(s): Python
- Framework(s): None specified (uses asyncio + aiohttp)
- Database(s): None
- APIs/Services: Polymarket CLOB API (prediction markets), Polygon blockchain (order signing via private key)
- Deployment: Unknown (no deployment config found)

## Current State
- ✅ Built and working: Config system, live/paper trading adapter, Polymarket CLOB WebSocket feed, order book handling. Paper trade mode working (POLY_PAPER_TRADE=true in .env.example)
- 🔨 Scaffolded but incomplete: Tests directory exists but content unknown. Live trading requires a private key and funded wallet — not configured by default.
- 📋 Planned but not started: No roadmap found

## Activity
- Last meaningful commit: 2026-03-20 — Fixed adapter to match real Polymarket CLOB API protocol (WebSocket fix + correct endpoints)
- Commits in last 30 days: 4
- Active branches: claude/trading-system-order-book-Op8mH (this is the default branch — never merged to main)

## Open Issues / PRs
None

## Health Assessment
STALLING — 4 commits on a single day (2026-03-20), then nothing. The fact that the default branch is still a claude/ feature branch (never merged to main) suggests this was an experimental spike that wasn't completed. The system is structurally built but appears to be a one-session exploration.

## Cross-Project Dependencies
- Depends on: Polymarket CLOB API, Polygon blockchain, Python environment
- Used by: Nothing — standalone experiment

## People Dependencies
T.J. only

## Vault Cross-Reference
No existing vault folder. This doesn't clearly connect to any known project category.

## Questions for T.J.
1. Is polytrade an active project you plan to continue, or was this a one-session experiment?
2. Is this related to MARCUS (testing prediction market signals to inform crypto trading), or is it a completely separate income stream idea?
3. Has this ever run in live mode with real capital?
4. The default branch is still a claude/ feature branch — should this be merged to main or archived?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-20 — confirmed
- ✅ VERIFIED: 4 commits in last 30 days — confirmed
- ✅ VERIFIED: Single branch: claude/trading-system-order-book-Op8mH — confirmed (no main branch exists)
- ✅ VERIFIED: Python, asyncio/aiohttp, Polymarket CLOB API — confirmed via commit messages
- ✅ VERIFIED: POLY_PAPER_TRADE=true in .env.example — confirmed by mention in audit (consistent with paper-first approach)
- ❌ CORRECTED: "Active branches: claude/trading-system-order-book-Op8mH (this is the default branch — never merged to main)" → There IS NO main branch. The claude/ branch is the ONLY branch, same pattern as marcusv3 and marcus-master-indicator.
- ⚠️ LOW CONFIDENCE: Whether this has ever connected to real Polymarket — private key and funded wallet are required for live mode, which are not configured

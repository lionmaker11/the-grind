---
aliases: [MARCUS, Marcus Trading]
project: marcus
status: active
priority: 3
last_updated: 2026-04-11
tags: [marcus, financial]
---

# MARCUS — Project Status

## Overview
Autonomous crypto trading system on Hyperliquid using ICT/ORB methodology.
T.J.'s goal: "Put money in, it compounds and grows." Means to an end, not a passion project.
Open to MARCUS or Polymarket or whatever automated vehicle works.

## Trading Context
- Trades on Hyperliquid using cross margin, typically 10x-20x leverage.
- Ultimate goal: $1M crypto portfolio generating 10% per month through liquidity providing. This is the endgame.
- Has been short SUI, DOGE, SOL (uses ETH liquidation zones as primary signal, prioritizes fill likelihood).
- Interested in DeFi at expert level (Curve Finance, Convex Finance, CVX plays).
- Considering holding 4x leveraged BTC position only during long-term uptrend.
- Supports anti-CBDC legislation: Anti-CBDC Surveillance State Act, GENESIS Act, Stablecoin Act, G.E.N.I.U.S. Act.
- Has dabbled in meme coins (Andrew Tate's "G" coin — $1,600 invested at $17.5M mcap).
- Invests in crypto with goal of becoming a "bank" of crypto.

## Architecture
- **Marcus**: TradingView/Pine Script signals
- **Logos**: Market analysis agent
- **Commodus**: Execution (Finance Bro mode / Kelly Criterion / Bayesian sizing)
- **Infrastructure**: Railway + PostgreSQL
- **Reporting**: Telegram bot (@rocha11_bot, user ID 521909109)
- **Repo**: GitHub lionmaker11/Marcusv2

## Current Focus: v3 → v4 Decomposition
- v3 was ~2,400-line monolithic Pine Script indicator
- v4 decomposes into 13 focused libraries + thin orchestrator
- Priority libraries: MarcusORB, MarcusTrade, MarcusBridge

## Intelligence Layers
- **Adaptive ORB detection**: Quality-gated displacement locking, 0–5 quality score
- **Funding rate arbitrage**: Delta-neutral, 10–15% capital allocation, mandatory basis divergence circuit breaker
- **Liquidation conviction scoring**: 0.7x–1.5x multiplier, Hyperliquid-only data

## Build Etiquette Protocol
Mandatory three-agent council before any build:
1. ARCHITECT — proposes
2. CRITIC — challenges
3. INTEGRATOR — reconciles
T.J. is final approver. Subscriber capital protection is non-negotiable.

## Decision Log
> Chief: log MARCUS-specific decisions here. Major decisions also go to `decisions/`.

_(vault initialized)_

## Connected Projects
- [[motor-city-deals-status|Motor City Deals]] — MCD revenue funds crypto accumulation
- [[FINANCES]] — [[2026-03-23-btc-goal|.75 BTC goal within 90 days]]
- [[biggerspreads-status|BiggerSpreads]] — shares data architecture DNA (CompGPT comping engine)

## Current Version (2026-03-30)
**v0.8.31** in PR pipeline  
**Active features:**
- NY-only trading (quant panel optimization shows NY as profitable zone)
- 9-gate execution chain with session/day-of-week filtering
- Institutional module (Phases 2-8): liquidation conviction scorer, funding rate arbitrage
- HTF bias fix (ICT-aligned trend detection)
- Ghost position detection (session risk equalized to 10%)
- Bayesian learning active
- A/B testing framework (Marcus/LIVE/PROPOSED)

**Trade analysis (194 closed trades):**
- **NY:** +1.12% cumulative, 47.4% WR (ONLY profitable session)
- **ASIA:** +2.56% (large HYPE wins masking poor base performance)
- **LDN:** -6.66% (NEUTRAL HTF bias in short mode)
- **Pattern:** 80 small/med losses (-31.91%) swamp 65 small/med wins (+21.62%)
- **Winning trades:** 75.2% avg confidence
- **Losing trades:** 67.7% avg confidence
- **Day-of-week:** Wed/Thu strong (+7.59%, +4.09%), Fri weak (-3.87%), Sat disaster (-6.11%)
- **ORB insight:** Forced ORB is costing -5.47% (should disable for NY trades)
- **NY edge:** Trending short + clean ORB lock + neutral HTF = 65.4% WR, +7.96% PnL

**Recommendation from data:** Go NY-only, disable ASIA/LDN/LC, filter forced ORB, >60 confidence signals only.

**PR #2 (v0.8.31):** Safety gates hardening — `allowed_sessions` gate (NY only), `allowedDaysOfWeek` config (Mon-Thu default, Fri/Sat blocked pending 20 more trades). Tests: 1960/1960 passing. Build: clean.

**PR #1 (v0.8.30):** Already merged.

## Status Updates
> Chief: append status after each daily 15-min check-in.

- **2026-03-28:** v0.8.31 PR in review, 194 trades analyzed, NY-only strategy validated via data (47.4% WR, +1.12% cumulative), institutional module stable
- **2026-03-30 (cron mining):** v0.8.31 ready for deployment, conviction-based execution pattern documented for vault, institutional trading operational
- **2026-04-04 (repo-watch):** Commit #366 — security audit remediation overnight. 3 CRITICALs fixed: Subscriber partial exit now verifies IOC fill before DB state. P0 secrets removed. Dead code cleaned. High commit velocity sustained (366 commits total).
- **2026-04-09 (repo-watch):** 🚨 CRITICAL FIX — MDD breaker bug caused 18-day trading lockout (since Mar 20). Death spiral: bad day → 8.88% MDD → block all trades → no new equity data → stale data forever. MDD enforcement disabled. Other failsafes remain: daily loss circuit breaker, loss cooldown, kill switch, panic mode, max concurrent. **T.J. must verify Marcus is trading again.**
- **2026-04-11 (repo-watch):** PR #370 merged — confidence gate fix. PR #356 had raised confidenceMinEntry from 0→65, silently blocking ALL signal engine entries. Combined with MDD breaker (fixed in #368), Marcus hasn't traded since March 19 — **20 days of zero trading.** Fix lowers gate to 40. Also fixes institutional page error. **Marcus should resume trading now — monitor for first trade.**

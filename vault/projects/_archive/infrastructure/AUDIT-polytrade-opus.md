# polytrade — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/polytrade

## What This Is
A Python quantitative trading system for Polymarket (prediction markets) using academic market microstructure models. Integrates five mathematical layers: (1) Kyle lambda estimation (adverse selection), (2) Hawkes process fitting (order flow clustering), (3) VPIN computation (volume-synchronized probability of informed trading), (4) Avellaneda-Stoikov market-making with adaptive spread, (5) Almgren-Chriss execution (large hedging orders). Connects to the real Polymarket CLOB API (WebSocket + REST). Paper trade mode enabled by default in .env.example.

## Tech Stack
Languages: Python 3.11
Frameworks: None (pure Python — asyncio, dataclasses)
Databases: None (in-memory)
External Services (from .env.example):
  - Polymarket CLOB API: prediction market trading (POLY_API_KEY, POLY_API_PASSPHRASE)
  - Polygon blockchain: order signing (POLY_PRIVATE_KEY — hot wallet, Polygon chain ID 137)
Deployment: None (no Procfile, no railway.json). Run locally via `python -m polytrade`.

## Current State
✅ Working:
  - Full trading engine implemented (5-layer stack)
  - Real Polymarket CLOB API adapter (WebSocket subscribe + REST orders) — corrected from simulated feed in recent commit
  - Paper trading mode default

🔨 In progress:
  - Open branch: claude/trading-system-order-book-Op8mH (appears to be the main development branch — all commits are here)

📋 Planned:
  - Live trading (POLY_PAPER_TRADE=false)

❌ Broken/placeholder:
  - No tests visible in file tree
  - Compiled .pyc files committed to repo (should be in .gitignore)
  - No deployment target defined

## Activity
Last commit: 2026-03-20T02:20:19Z — Fix adapter to match real Polymarket CLOB API protocol
Commits (30d): 4
Branches: claude/trading-system-order-book-Op8mH (main branch is empty or has no default — all work on claude/ branch)

## Open Issues / PRs
None

## Health
STALLING — 4 commits all in a burst around 2026-03-20, then stopped. No deployment target, no tests. Unclear if this is an active project or an experiment. Paper trade only so far.

## External Services (verified from .env.example)
- Polymarket CLOB API: prediction market data and order placement
- Polygon blockchain (chain ID 137): Ethereum-compatible order signing (requires private key)

## Cross-Project Links
None verified. Conceptually related to Marcusv2 (both are algorithmic trading systems) but no code connection.

## Questions for T.J.
1. Is polytrade an active project or an experiment you put down? Should it be archived?
2. If you plan to continue it, is this for actual Polymarket trading, or is it a learning exercise in market microstructure?

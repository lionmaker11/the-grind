# polytrade — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/polytrade

## What This Is
A Python quantitative trading system for Polymarket prediction markets. Connects to the Polymarket CLOB API via an Ethereum wallet on Polygon (chain ID 137) to place and manage prediction market orders. Has a paper trading mode (POLY_PAPER_TRADE=true default) and a live trading mode. Modules include engine.py, market_maker.py, simulate.py, orders.py, execution.py, and a feed. Tests cover live and system scenarios.

## Tech Stack
- Languages: Python 3.10+
- Frameworks: None (pure Python)
- Databases: None
- External Services (from .env.example):
  - Polymarket CLOB API — prediction market order placement (API key + passphrase)
  - Polygon blockchain — Ethereum private key for order signing (chain ID 137)
- Deployment: None visible (no Procfile, railway.json, or docker-compose)
- Dependencies (pyproject.toml): numpy>=1.24, scipy>=1.10, aiohttp>=3.9

## Current State
- ✅ Working: Core trading modules exist (engine, market_maker, simulate, execution, orders, feed), test suite present (test_live.py, test_system.py)
- 🔨 In progress: Unknown — branch claude/trading-system-order-book-Op8mH suggests order book work
- 📋 Planned: Unknown
- ❌ Not working / broken: Cannot determine — no deployment config, no CLAUDE.md, no README

## Activity
- Last commit: 2026-03-20T02:20:19Z — Fix adapter to match real Polymarket CLOB API protocol
- Commits in last 30 days: 4
- Active branches: claude/trading-system-order-book-Op8mH, main (inferred from branch name)

## Open Issues / PRs
None

## Health
STALLING — 4 commits, last Mar 20. No README, no CLAUDE.md, minimal documentation. Unclear if this is actively used or an experiment.

## Service Architecture
None — runs locally via python -m polytrade (CLI entry point from pyproject.toml scripts).

## External Dependencies
- Polymarket CLOB API: Prediction market order placement
- Polygon (Ethereum): Private key signing for Polymarket orders

## Cross-Project Links
None.

## People
T.J.

## Questions for T.J.
1. Is polytrade actively trading with real money on Polymarket, or is it running in paper mode?
2. Is this related to Marcusv2's strategy in any way, or completely separate?
3. Why does this repo have no README or CLAUDE.md? Is it a personal experiment not meant to be maintained long-term?

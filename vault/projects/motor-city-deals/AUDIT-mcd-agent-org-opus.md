# mcd-agent-org — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/mcd-agent-org

## What This Is
Python-based AI agent organization for Motor City Deals. Six autonomous agents (Roman/GM, Mira/Acquisition, Cole/Disposition, Nix/DataOps, Sage/Intelligence, plus one unnamed) each run as separate Python services. Roman (GM) receives commands from T.J. via Telegram, uses Claude to reason, and delegates to specialists via the MCDCommand API. Other agents call MCDCommand REST endpoints and respond with AI-generated analysis. Scaffold includes Dockerfile for containerized deployment.

## Tech Stack
Languages: Python 3.11
Frameworks: asyncio, python-telegram-bot, anthropic SDK
Databases: None (delegates to MCDCommand's PostgreSQL via API)
External Services (from .env.example):
  - MCDCommand API (MCD_API_URL): all data and actions go through the platform
  - Anthropic/Claude: agent reasoning (ANTHROPIC_API_KEY)
  - Telegram Bot API: Roman GM receives commands, sends summaries (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID: 521909109)
Deployment: Dockerfile present — intended for Railway or Docker deployment. No Procfile or railway.json found.

## Current State
✅ Working:
  - Full scaffold: 6 agent directories, shared client library, Dockerfile
  - Roman GM: Telegram bot handler, MCDCommand dashboard query, task delegation
  - Agent soul strings defined (each agent has personality + domain)

🔨 In progress:
  - Nothing — one commit, no subsequent activity

📋 Planned:
  - Full agent logic (currently scaffold only — main.py files are minimal)

❌ Broken/placeholder:
  - All agents are scaffolds only — no real task execution logic beyond Roman's basic Telegram handling
  - No railway.json or Procfile — deployment process unclear
  - No tests

## Activity
Last commit: 2026-03-17T15:07:13Z — MCD Agent Org — 6 Python AI agents for Motor City Deals
Commits (30d): 1 (single initial commit)
Branches: main

## Open Issues / PRs
None

## Health
STALLING — Single commit on 2026-03-17, no subsequent development. This is a skeleton waiting for implementation. The MCDCommand AUDIT.md (2026-04-02) notes that Roman's Railway "agent-gm service is a separate Python repo" — that's this repo. No evidence it's running anywhere.

## External Services (verified from .env.example)
- MCDCommand API: all data operations routed through MCDCommand platform
- Anthropic/Claude: agent reasoning (Claude Sonnet per code)
- Telegram Bot API: GM command interface (T.J. → Roman)

## Cross-Project Links
- MCDCommand: primary dependency — all data fetched from MCDCommand API endpoints
- MCDCommand AUDIT.md references "agent-gm service is a separate Python repo" — confirms this is the intended deployment target

## Questions for T.J.
1. Is mcd-agent-org deployed anywhere? MCDCommand's AUDIT.md says "agent-gm service is a separate Python repo" but this repo has one scaffold commit. Is this the active repo for that service, or is it running from somewhere else?
2. Is Roman the only agent you want deployed initially, or do you want all 6 running?

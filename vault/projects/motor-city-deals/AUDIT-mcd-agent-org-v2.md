# mcd-agent-org — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/mcd-agent-org

## What This Is
A standalone Python AI agent organization layer for Motor City Deals. Six agents (GM, Team Lead, Acquisition Ops, Disposition Ops, Data Ops, Intelligence Ops) defined in a docker-compose with 6 services. Each agent is a Python process that communicates with the MCDCommand API (via MCD_API_URL) and uses Anthropic's Claude API. The GM agent has Telegram integration for T.J. notifications. This is separate from MCDCommand's built-in 6-agent AI system.

## Tech Stack
- Languages: Python 3
- Frameworks: FastAPI, uvicorn, pydantic, python-telegram-bot
- Databases: None (calls MCDCommand API)
- External Services (from .env.example):
  - MCDCommand API (MCD_API_URL) — primary data source
  - Anthropic Claude API — agent intelligence
  - Telegram Bot API — GM agent notifications (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID: 521909109)
- Deployment (from docker-compose.yml — 6 services):
  1. gm (GM agent)
  2. team-lead
  3. acquisition-ops
  4. disposition-ops
  5. data-ops
  6. intelligence-ops
- Dependencies (requirements.txt): anthropic>=0.40.0, httpx>=0.27.0, pydantic>=2.0.0, fastapi>=0.115.0, uvicorn>=0.32.0, python-telegram-bot>=21.0

## Current State
- ✅ Working: Directory structure and basic agent scaffolding exist, docker-compose defines 6 services, shared MCD client module
- 🔨 In progress: Unknown — only 1 commit (initial)
- 📋 Planned: Full agent implementation (each agent's src/main.py exists but content unknown)
- ❌ Not working / broken: Almost certainly not running — 1 commit, no updates since Mar 17

## Activity
- Last commit: 2026-03-17T15:07:13Z — MCD Agent Org — 6 Python AI agents for Motor City Deals
- Commits in last 30 days: 1 (initial commit only)
- Active branches: main

## Open Issues / PRs
None

## Health
STALLING/ABANDONED — Single initial commit, no development since Mar 17. Relationship to MCDCommand's built-in AI agents is unclear. May be an abandoned parallel approach.

## Service Architecture
docker-compose (6 services): gm, team-lead, acquisition-ops, disposition-ops, data-ops, intelligence-ops. All share a single Docker image but different entry points.

## External Dependencies
- MCDCommand API: All agents call MCD_API_URL for data
- Anthropic Claude API: Agent intelligence
- Telegram Bot API: GM agent notifications

## Cross-Project Links
- MCDCommand: Primary dependency (this org calls MCDCommand's API)
- MCDCommand already has a built-in 6-agent system — this appears to be a DUPLICATE/PARALLEL approach

## People
T.J.

## Questions for T.J.
1. MCDCommand already has 6 built-in AI agents (Roman, Mira, Cole, Nix, Sage, Vigil). Is mcd-agent-org meant to replace them, supplement them, or was it an abandoned experiment?
2. Has mcd-agent-org ever been run? The docker-compose exists but there's only 1 commit.
3. If this was abandoned in favor of MCDCommand's built-in agents, should this repo be archived?

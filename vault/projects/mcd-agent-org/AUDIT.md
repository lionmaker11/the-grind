# mcd-agent-org — Repo Audit
**Repo:** https://github.com/lionmaker11/mcd-agent-org
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-17 — MCD Agent Org — 6 Python AI agents for Motor City Deals

## What This Is
mcd-agent-org is a companion Python micro-service to MCDCommand. It implements the 6 AI agents (Roman the GM, plus acquisition, disposition, data ops, intelligence, and compliance agents) as independent Python processes with FastAPI endpoints, organized in a Docker-based multi-agent architecture. Each agent has its own directory under /agents/, with a /shared/ module for cross-agent utilities. It communicates with the main MCDCommand Next.js app via an API key.

## Tech Stack
- Language(s): Python
- Framework(s): FastAPI, Uvicorn, anthropic SDK, python-telegram-bot
- Database(s): None direct (reads from MCDCommand via API)
- APIs/Services: Anthropic Claude (agent AI), Telegram (GM notifications), MCDCommand API
- Deployment: Docker + docker-compose

## Current State
- ✅ Built and working: Full 6-agent org scaffolded and committed in a single commit (Stage 5 Days 48-56). Docker setup with docker-compose. FastAPI server per agent. Shared utilities.
- 🔨 Scaffolded but incomplete: Single commit history suggests this was dropped in as a scaffold — unclear how much of the agent logic is fully implemented vs. placeholder. No subsequent commits after the initial drop.
- 📋 Planned but not started: Unclear — no issues or roadmap found

## Activity
- Last meaningful commit: 2026-03-17 — Initial full scaffold (single commit, entire org dropped in)
- Commits in last 30 days: 1
- Active branches: main only

## Open Issues / PRs
None

## Health Assessment
STALLING — Single commit, no subsequent work. The MCDCommand repo (Next.js) has had 30+ commits since 3/17 while this companion Python repo has had zero. It's possible the agent logic was folded back into MCDCommand directly, making this repo redundant, or it may be waiting for integration work.

## Cross-Project Dependencies
- Depends on: MCDCommand (API), Anthropic API, Telegram bot
- Used by: MCDCommand (calls agent endpoints)

## People Dependencies
T.J. only (no named collaborators in config)

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/motor-city-deals/ (companion to MCDCommand)

## Questions for T.J.
1. Is mcd-agent-org actively running as a separate service alongside MCDCommand, or was the Python agent logic folded into the Next.js app instead?
2. If it's running — is it deployed on Railway alongside MCDCommand?
3. If it's not running — should this repo be archived to avoid confusion?
4. (NEW) The Python mcd-agent-org has a "team-lead" agent directory that has no equivalent in MCDCommand's 6-agent list — what is team-lead's role and why does it not appear in the Next.js system?
5. (NEW) The .env.example contains a real Telegram chat ID (521909109) — is this T.J.'s personal Telegram chat? Is Roman the GM still sending Telegram messages?
6. (NEW) The Python agents reference 4 specialists (Mira, Cole, Nix, Sage) — but NOT the compliance/Vigil agent. Was Vigil never part of the Python org design?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-17, single commit, main branch only — confirmed
- ✅ VERIFIED: FastAPI (fastapi>=0.115.0) in requirements.txt — confirmed
- ✅ VERIFIED: python-telegram-bot, anthropic, httpx, pydantic, uvicorn in requirements.txt — confirmed
- ✅ VERIFIED: Dockerfile + docker-compose.yml present (not just docker-compose) — confirmed
- ❌ CORRECTED: Agent count/names — The repo has 6 agent directories: gm/, team-lead/, acquisition-ops/, disposition-ops/, data-ops/, intelligence-ops/. The AUDIT described them as "Roman, Mira, Cole, Nix, Sage, plus compliance agent" — but this repo has "gm (Roman), team-lead (unknown role), acquisition-ops, disposition-ops, data-ops, intelligence-ops." There is NO compliance agent in this Python org. "team-lead" is an unlisted 6th agent.
- ❌ CORRECTED: The audit says MCDCommand "depends on mcd-agent-org" — but MCDCommand's CLAUDE.md has no reference to a Python companion service. The dependency may be one-directional (mcd-agent-org calls MCDCommand's API) or non-existent in production.
- ⚠️ LOW CONFIDENCE: Whether this Python org is actually deployed anywhere. No Railway config in this repo (no railway.json or railway.toml). Single-commit scaffold with no follow-up suggests it may never have been deployed.
- ⚠️ LOW CONFIDENCE: The .env.example has a partial real Telegram chat ID (521909109) — unclear if this reflects real deployment or was left in as reference.

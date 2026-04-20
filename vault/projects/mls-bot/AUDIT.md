# mls-bot — Repo Audit
**Repo:** https://github.com/lionmaker11/mls-bot
**Audit Date:** 2026-04-03
**Last Commit:** 2026-03-16 — Update email and SMS templates for MCD

## What This Is
mls-bot is a standalone outreach bot for expired and withdrawn MLS listings in the Motor City Deals pipeline. It's a Python + Flask web app with a full browser-based dashboard (no terminal needed after deploy). Ali uploads a CSV of MLS leads, the bot sends email (and optionally SMS via Twilio) outreach to real estate agents on behalf of Ali, and tracks all conversations. Deployed on Railway. This is distinct from MCDCommand — it's a simpler, agent-facing tool rather than the full command center.

## Tech Stack
- Language(s): Python, HTML
- Framework(s): Flask (app.py), with HTML templates
- Database(s): None found (likely in-memory or file-based)
- APIs/Services: SendGrid (email), Twilio (SMS, optional), Railway (deployment)
- Deployment: Railway (Procfile + railway.toml)

## Current State
- ✅ Built and working: CSV upload, test send (3 emails to self), run bot (sends to all uncontacted agents), conversations view, config tab (credentials + schedule). Email templates updated for MCD branding. AI draft banner added to email compose.
- 🔨 Scaffolded but incomplete: SMS via Twilio listed as "optional" with manual setup steps — likely not configured in production. Campaign management and DNC scrub logic added in late commits but full pipeline integration unclear.
- 📋 Planned but not started: No issues found

## Activity
- Last meaningful commit: 2026-03-16 — Updated email and SMS templates for MCD branding
- Commits in last 30 days: 30 (heavy activity March 14-16)
- Active branches: main only

## Open Issues / PRs
None

## Health Assessment
STALLING — 30 commits in the 30-day window but all concentrated in mid-March. No activity after 2026-03-16. MCDCommand appears to have superseded this as the primary outreach system. mls-bot may have been the simpler v1 tool that MCDCommand replaced.

## Cross-Project Dependencies
- Depends on: SendGrid (email), Twilio (optional SMS), Railway
- Used by: Ali Alshehmani (Motor City Deals partner) uses the dashboard directly

## People Dependencies
Ali Alshehmani — the README explicitly names Ali's email (Ali@motorcitydeals.com) and phone (7345962544) as the deployment config. This is Ali's tool.

## Vault Cross-Reference
Maps to ~/Documents/lionmaker-vault/projects/motor-city-deals/ (Ali's outreach tool)

## Questions for T.J.
1. Is mls-bot still running in production, or has MCDCommand replaced it entirely?
2. Is Ali actively using mls-bot's dashboard, or has he transitioned to MCDCommand?
3. Should this repo be archived once MCDCommand's outreach features are fully live?

## Fact-Check Notes (2026-04-03)
- ✅ VERIFIED: Last commit 2026-03-16 — confirmed
- ✅ VERIFIED: Branch: main only — confirmed
- ✅ VERIFIED: Flask, SendGrid, Twilio, Railway (Procfile + railway.toml) in tech stack — confirmed
- ❌ CORRECTED: "Commits in last 30 days: 30" → Actually 86 commits in the 30-day window (since 2026-03-04). All still concentrated March 14-16. The commit count was significantly understated.

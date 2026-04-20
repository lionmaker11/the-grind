# mls-bot — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/mls-bot

## What This Is
Automated email + SMS outreach bot for Expired and Withdrawn MLS listings. Python/Flask web app with a full dashboard (no terminal required post-deploy). Accepts MLS CSV uploads, sends templated outreach to agents via SendGrid email (and optionally Twilio SMS), tracks conversations, and schedules automated sends via APScheduler. Configured for Ali Alshehmani at motorcitydeals.com in the README (Ali appears to be a team member).

## Tech Stack
Languages: Python 3
Frameworks: Flask, Gunicorn, APScheduler
Databases: None visible (appears to be in-memory or flat file — no SQLAlchemy, no database URL in README)
External Services (from requirements.txt — no .env.example found):
  - SendGrid: email outreach (SENDGRID_API_KEY per README)
  - Twilio: SMS outreach, optional (TWILIO_SID, TWILIO_AUTH, TWILIO_FROM per README)
  - APScheduler: scheduled send jobs
Deployment (from Procfile — 1 process):
  - web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120

## Current State
✅ Working:
  - Full Flask app with dashboard (CSV upload, test send, run bot, conversations view, config)
  - Email outreach via SendGrid
  - Optional Twilio SMS

🔨 In progress:
  - Nothing — last commit 2026-03-16

📋 Planned:
  - None documented

❌ Broken/placeholder:
  - No database visible — unclear how conversation history persists across restarts (risk of data loss)
  - No .env.example — environment configuration relies on Railway Variables per README only

## Activity
Last commit: 2026-03-16T01:59:07Z — Update email and SMS templates for MCD
Commits (30d): 86 (all concentrated between 2026-03-04 and 2026-03-16 — heavy burst then full stop)
Branches: main

## Open Issues / PRs
None

## Health
STALLING — 86 commits in 12 days (2026-03-04 to 2026-03-16), then complete stop. The heavy burst suggests an AI-assisted build sprint. No activity since mid-March. MCDCommand has built-in MLS outreach functionality — unclear if mls-bot is still being used or has been superseded.

## External Services (verified from requirements.txt + README env vars)
- SendGrid: email outreach
- Twilio: SMS outreach (optional)

## Cross-Project Links
- MCDCommand: has overlapping outreach functionality (Mira agent, campaign-sender). mls-bot may be a predecessor or parallel tool for MLS-specific workflows.

## Questions for T.J.
1. Is mls-bot still in active use, or has its functionality been absorbed into MCDCommand? If superseded, should it be archived?
2. Who is Ali Alshehmani? The README has Ali's name and email hardcoded as the sender identity.
3. Does mls-bot have persistent storage? If Flask crashes, does conversation history survive?

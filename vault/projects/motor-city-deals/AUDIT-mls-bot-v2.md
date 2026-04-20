# mls-bot — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/mls-bot

## What This Is
A standalone Flask/Python web app for automated outreach to Expired and Withdrawn MLS listings. Upload a CSV of MLS data via a web dashboard, then send personalized emails (SendGrid) and SMS (Twilio) to listing agents. Has APScheduler for scheduled scans. Deployed on Railway. This appears to be an earlier single-purpose tool that MCDCommand's acquisition pipeline has largely superseded.

## Tech Stack
- Languages: Python 3
- Frameworks: Flask, Gunicorn (2 workers)
- Databases: None visible
- External Services (from README — not verified via .env.example which wasn't accessible):
  - SendGrid — email outreach (SENDGRID_API_KEY)
  - Twilio — SMS outreach (implied by twilio>=8.0.0 in requirements.txt)
  - APScheduler — scheduled scan at configurable time (SCAN_TIME=09:00)
- Deployment (from Procfile + railway.toml):
  - 1 service: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
- Dependencies (requirements.txt): flask>=2.3.0, python-dotenv>=1.0.0, sendgrid>=6.10.0, twilio>=8.0.0, APScheduler>=3.10.0, gunicorn>=21.0.0, Werkzeug>=2.3.0, tzdata>=2024.1, pytz>=2023.3

## Current State
- ✅ Working: Flask web dashboard with upload, test-send, and run-bot actions, scheduled scanning, email/SMS templates updated for MCD
- 🔨 In progress: Nothing visible
- 📋 Planned: Nothing visible
- ❌ Not working / broken: Unknown runtime status

## Activity
- Last commit: 2026-03-16T01:59:07Z — Update email and SMS templates for MCD
- Commits in last 30 days: 86 (between Mar 4-16 — 86 commits in 12 days, then stopped)
- Active branches: main

## Open Issues / PRs
None

## Health
STALLING — Burst of 86 commits between Mar 4-16, then stopped. Last update was an MCD template update. MCDCommand's acquisition pipeline (with campaign-sender, Twilio integration, and full conversation management) appears to have superseded this tool.

## Service Architecture
Railway (1 service):
- web: gunicorn Flask app (dashboard + API)

## External Dependencies
- SendGrid: Email delivery for agent outreach
- Twilio: SMS outreach (separate from MCDCommand's Twilio account/number)

## Cross-Project Links
- MCDCommand: Functionally superseded by MCDCommand's campaign-sender, email-sender, and Twilio integration

## People
T.J. (and Ali Alshehmani per README — who is "Ali" at motorcitydeals.com?)

## Questions for T.J.
1. Who is Ali Alshehmani (FROM_EMAIL=Ali@motorcitydeals.com in README)? Is this a team member or a placeholder?
2. Is mls-bot still being used for outreach, or has MCDCommand fully replaced it?
3. The 86 commits in 12 days (Mar 4-16) followed by complete silence is unusual. What happened?

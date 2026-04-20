# real-estate-calculator — Audit v2
**Date:** 2026-04-03
**Audited by:** Claude Sonnet (deep audit)
**Repo:** https://github.com/lionmaker11/real-estate-calculator

## What This Is
An early-stage real estate deal calculator SaaS. Express.js backend with MongoDB (mongoose), JWT auth, bcrypt. React 17 frontend (Create React App) with Chart.js for visualizations. Backend routes for auth and calculations. Deployed on Heroku (package.json has heroku-postbuild script). Appears to be a very early prototype from early 2025 (last commit Feb 2025).

## Tech Stack
- Languages: JavaScript (no TypeScript)
- Frameworks: Express 4 (backend), React 17 / Create React App (frontend), react-chartjs-2
- Databases: MongoDB via mongoose
- External Services: None visible
- Deployment: Heroku (heroku-postbuild script in backend/package.json)
- Dependencies: express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv (backend); react, react-dom, react-router-dom v5, axios, chart.js (frontend)

## Current State
- ❌ Early prototype: No CLAUDE.md, no README visible, basic auth + calculations scaffolding only
- ❌ Not working / unknown: Heroku free tier was shut down Nov 2022 — this may never have been live

## Activity
- Last commit: 2025-02-20T16:03:12Z — Update NavigationBar.js
- Commits in last 30 days: 0
- Active branches: main

## Open Issues / PRs
None

## Health
ABANDONED — Last commit Feb 2025 (14+ months ago). No TypeScript. No test infrastructure. Early prototype that was superseded by MCDCommand's built-in MAO calculator and deal underwriting.

## Service Architecture
None active. Heroku (now defunct free tier) was the target.

## External Dependencies
None external (MongoDB only).

## Cross-Project Links
- MCDCommand: Has a complete MAO calculator (src/modules/mao-calculator.ts) and deal underwriting that supersedes this

## People
T.J.

## Questions for T.J.
1. Is there any reason to keep this repo? It predates MCDCommand by a year and has been superseded.
2. Should it be archived?

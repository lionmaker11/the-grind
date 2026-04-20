# real-estate-calculator — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/real-estate-calculator

## What This Is
A full-stack real estate investment calculator with user authentication. Node.js/Express backend + React frontend (11 files total). Backend uses MongoDB (Mongoose), JWT auth, bcrypt for passwords. Has routes for auth (register/login) and calculations. A Heroku deployment script is in package.json (heroku-postbuild). This appears to be an early/learning project — predates MCDCommand's built-in underwriting and MAO calculator.

## Tech Stack
Languages: JavaScript (not TypeScript)
Frameworks: Express.js (backend), React (frontend — Create React App assumed)
Databases: MongoDB (Mongoose)
External Services: None visible (no .env.example at root — middleware.js exists but unclear scope)
Deployment: Heroku (heroku-postbuild in package.json) — no Railway configuration

## Current State
✅ Working: Unknown — code exists but is 14 months old with no recent activity
❌ Broken/placeholder: Heroku free tier was discontinued in 2022 — likely not deployed anywhere

## Activity
Last commit: 2025-02-20 — Update NavigationBar.js
Commits (30d): 0
Branches: main

## Open Issues / PRs
None

## Health
ABANDONED — Zero commits since February 2025 (14 months ago). Heroku deployment target is defunct. MCDCommand has superseded all calculator functionality with its MAO calculator, progressive underwriter, and deal calibration system. This repo has no active purpose.

## External Services (verified from .env.example)
None — no .env.example.

## Cross-Project Links
- MCDCommand: superseded this with its MAO calculator (src/modules/mao-calculator.ts) and progressive underwriter

## Questions for T.J.
1. real-estate-calculator is 14 months old and superseded by MCDCommand. Is it safe to archive this repo?

# the-grind — Status

**Repo:** https://github.com/lionmaker11/the-grind
**App:** https://the-grind-gold.vercel.app
**Status:** ACTIVE

## What This Is

TheGrind is T.J.'s personal command-center app. Muse is the sole operator, behind `/api/chief`. The frontend shows the top 3 pending tasks per active project, pulled from each project's `backlog.json` and sorted by priority 1-5. T.J. voice-dumps; Muse files to backlogs.

This folder's backlog is the **meta-backlog for the app itself** — improvements, bugs, and build tasks for TheGrind. It is lightweight: not rotated into a daily queue (there is no queue), surfaced only when T.J. opens this project or Muse is asked about it.

## Tech Stack

- Frontend: HTML/JS PWA on Vercel
- Backend: Vercel serverless (`/api/chief`, `/api/backlog`, `/api/sync`)
- AI: Anthropic SDK (Claude)
- State: JSON files in the vault repo

## Health

GREEN — backend rewrite landed 2026-04-21. Frontend rework is the next open item, tracked in a separate chat.

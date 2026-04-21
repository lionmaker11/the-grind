# Session Handoff — 2026-04-21

## Current state

The backend was rewritten. Hermes/Chief is fully retired. Muse is the sole operator and lives behind `/api/chief`. No briefs, no scheduled jobs, no daily queue.

**How it works now:**
- The frontend shows the top 3 pending tasks per active project, pulled from `vault/projects/{id}/backlog.json`, sorted by task priority 1-5.
- T.J. voice-dumps at any time. Muse interprets and files items to the correct project backlog.
- Every new task gets a priority on add. If T.J. didn't state one, Muse asks one question to get it.
- On Sundays and Thursdays, Muse opens her first turn of the day with a priority-review invitation for one backlog (biweekly priority review).

## Muse's tool set (the only actions she can take)

- `add_to_backlog(project_id, text, priority, done_condition?, category?, estimated_pomodoros?)`
- `set_task_priority(project_id, task_id, priority)`
- `complete_backlog_task(project_id, task_id)`
- `remove_from_backlog(project_id, task_id)`
- `reorder_backlog(project_id, order[])`
- `add_project(name, priority, aliases?)`
- `archive_project(project_id)`
- `activate_project(project_id)`

## Files retired

All of these are gone from the new model. Do not re-introduce without T.J. approval:

- `chief-briefing.md`
- `today.json`
- `vault/daily/`
- `vault/daily-briefs/`
- `.claude/routines/` (morning.md, eod.md, etc.)
- `api/today.js`
- `api/check-update.js`
- `api/re-entry.js`

## Still open

- **Frontend rework** — the `index.html` UI needs to be reworked to match the new model (top-3-per-project view, Muse chat posting to `/api/chief`, no queue). This is happening in a separate chat per the architecture spec. Do not start it here.

## Do not touch

- `vault/systems/muse-system.md` and `vault/systems/OWNERSHIP.md` — just rewritten, authoritative.
- Anything under `/api/` — backend is settled.
- Any `backlog.json` — Muse owns those at runtime.

## Historical reference

`vault/systems/the-grind.md` and `vault/systems/thegrind-build-spec.md` describe the old push/queue/brief model. Both carry a RETIRED 2026-04-21 banner at the top. Read the banner, then ignore the body unless you're digging into history.

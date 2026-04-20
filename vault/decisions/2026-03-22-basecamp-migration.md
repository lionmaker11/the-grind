---
aliases: [Basecamp Migration]
date: 2026-03-22
project: chief
tags: [decision]
---

# Decision: Migrate from Trello to Basecamp

## Context
Trello was being used for Base Camp board (day-of-week columns + Backlog + Done). Needed more structure for project management across 10+ projects.

## Options Considered
1. **Stay on Trello** — familiar but limited, no native project separation
2. **Basecamp** — per-project to-do lists, milestones, better for PMP-style management
3. **Linear** — too dev-focused for lifestyle management

## Decision
Option 2. Migrated to Basecamp (account 6179867). All 11 projects created with to-do lists, milestones, and due dates.

## Expected Outcome
- Each project has its own space with dedicated to-do lists
- Calendar sync via hourly cron (Basecamp due dates → Google Calendar)
- Better visibility into project health

## Follow-ups
- [x] All projects created in Basecamp
- [ ] Basecamp token refresh April 1 (expires April 6)

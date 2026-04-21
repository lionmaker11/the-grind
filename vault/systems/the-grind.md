> **RETIRED 2026-04-21.** This file describes the pre-rewrite push/queue/brief model. See `vault/systems/muse-system.md` and `vault/systems/OWNERSHIP.md` for the current spec. Kept for historical reference only.

# The Grind — System Notes

## URLs
- App: https://the-grind-gold.vercel.app
- Repo: https://github.com/lionmaker11/the-grind
- Vault: https://github.com/lionmaker11/lionmaker-vault

## What It Is
T.J.'s personal execution app. Daily task queue + voice interaction + agent-powered task management.
The agent powers it — queues tasks morning, tracks completions EOD, adapts tomorrow.

## NEW WORKFLOW (as of 2026-04-20)

### Daily Cadence
1. MORNING: Agent analyzes active projects, queues next 3 tasks per project + workout
2. DURING DAY: T.J. executes. Can "load more" on any project to go deep.
3. EOD: T.J. checks in (voice or text) — what got done, what didn't
4. EVENING: Agent queues next day based on results

### Active Projects (3 tasks/day each)
| Project | Type | Notes |
|---------|------|-------|
| TheGrind | App Dev | Perfecting the app itself |
| Lionmaker Systems | Service Biz | AI dev for RE brokerages, execution checklist |
| Alex Buildium Bot | Client Work | Buildium integration for Alex |
| UIL Fast Track | Learning/Investing | Liquidity providing, step-by-step |
| Lionmaker Kettlebell App | App Dev/Fitness | iOS app, nearly done |
| GrillaHQ | MCD Command Center | A2P resubmitted, active development |

### Lightweight (1 task or check-in)
| Project | Type | Notes |
|---------|------|-------|
| 708 Pallister | Rehab | Daily Sam check-in, push as needed |
| Motor City Deals | Wholesaling | Ali check-in, closings, fading out |

### Off the Board
- MARCUS (running, no action)
- BiggerSpreads (on hold)
- Digital Product Empire (maintenance)

## Key Rules
- 3 tasks per active project daily
- Goal: complete at least 1 per project to keep momentum
- "Load more" available if going all-in on one project
- Workouts included daily (from KB training PDF)
- No time assignments — just priority order
- Minimum 1 completion per project per day keeps it GREEN

## Data Flow
```
Morning  — Agent reads vault + project backlogs
         — Generates daily queue (3/project + workout)
         — Pushes chief-briefing.md to the-grind repo

Day      — T.J. executes in app
         — Voice check-ins for updates
         — "Load more" requests handled live

EOD      — T.J. voice dumps what got done
         — Agent marks completions
         — Results logged to results/YYYY-MM-DD.json

Evening  — Agent reviews results
         — Queues next day tasks
         — Updates vault project health
```

## Key Files in Repo
| File | Owner | Purpose |
|------|-------|---------| 
| chief-briefing.md | Agent (writes daily) | Context + ---QUEUE--- block |
| results/date.json | App (writes) | Completion data |
| api/chief.js | Developer | In-app agent logic |

## Project Health Rules
- GREEN: Task completed in last 2 days
- YELLOW: 3-5 days without completion
- RED: 7+ days without completion
- GRAY: Blocked/paused (no action needed)

## Score Rules
- Score <50 consistently → lighten queue
- Score >90 consistently → add more
- Same task skipped 3+ days → break smaller or address blocker
- Minimum viable day = 1 task per active project = keeps streak alive

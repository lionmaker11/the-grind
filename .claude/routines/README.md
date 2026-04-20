# Claude Routines — The Grind

Scheduled prompts for Muse, run via Claude Code on the web.

## Why they live here
Claude Code routines are configured in claude.ai/code, but the **prompt bodies** are the real IP. Keeping them in the repo means:
- Diffable — we can see when the morning prompt changed
- Reviewable — persona drift gets caught in PR
- Restorable — if a routine is deleted, the prompt survives

The cron + model + name are configured in the Claude Code web UI. This directory holds only the prompt source.

## Active routines (scaffolded — not yet wired)

| File | Model | Cron | Purpose |
|---|---|---|---|
| `morning.md` | Sonnet 4.6 | 06:00 Mon-Sat | Read EOD from yesterday, write today's queue |
| `midday.md` | Haiku 4.5 | 12:00 Mon-Sat | Quick progress check, nudge if stalled |
| `eod.md` | Sonnet 4.6 | 17:30 Mon-Sat | EOD rollup — what got done, what didn't, blockers |
| `sunday-review.md` | Opus 4.7 | 07:00 Sun | Weekly review across all projects, set priorities |

## Wiring timeline
- **Day 1 (now):** Re-Entry Mode only. No routines yet.
- **Week 1:** Muse listens during EOD voice dumps — no automation.
- **Week 2:** Wire `morning.md` + `eod.md`. Skip midday.
- **Week 3:** Add `sunday-review.md`.
- **Week 4:** Add `midday.md` if useful. Sunset Hermes' `chief-briefing.md`.

## Model tiering rationale
- **Haiku 4.5:** cheap parsers (re-entry, midday check-ins, voice-to-task)
- **Sonnet 4.6:** daily generation (morning, EOD) — balanced cost/quality
- **Opus 4.7:** weekly review + blocker diagnosis — reasoning-heavy, low frequency

## Prompt structure (all routines)
Every routine prompt must:
1. Include the system prefix from `vault/systems/muse-system.md` (persona)
2. Read `vault/MEMORY.md` + `vault/NORTH_STAR.md` (identity layer)
3. Read `vault/projects/_registry.json` (active projects)
4. Read the latest `vault/daily/YYYY-MM-DD.json` + `vault/conversations/YYYY-MM-DD.jsonl`
5. Write to its owned path per `vault/systems/OWNERSHIP.md`
6. Never write outside its lane

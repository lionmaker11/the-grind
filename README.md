# The Grind

Personal command-center PWA for one user. Hosted on Vercel. Vault-backed — this repo is the source of truth. Everything the app reads and writes is version-controlled under `vault/`.

## What it does

- Shows the top 3 pending tasks per active project on open
- Lets you run 25/5 Pomodoro focus blocks on any of them
- Lets you voice-dump to Muse, an operator agent who files ideas to the right project backlog at the right priority
- Prompts a priority review on Sundays and Thursdays

## Architecture

Static frontend (`index.html`, actively being rewritten) talks to Vercel serverless endpoints under `/api/`. Muse (Claude Sonnet) lives behind `POST /api/chief`. Voice input goes through Groq Whisper, then to Muse, which issues tool calls; the frontend applies the actions and the backend persists changes to `vault/projects/{id}/backlog.json` via the GitHub Contents API.

## Endpoints

| Route | Method | Purpose |
|---|---|---|
| `/api/chief` | POST | Chat with Muse |
| `/api/transcribe` | POST | Voice to text (Groq Whisper) |
| `/api/backlog` | GET | Backlog summary or one project |
| `/api/backlog` | POST | add / remove / set_priority / complete / reorder / load |
| `/api/project` | POST | add / archive / activate |
| `/api/sync` | POST | conversation_append (chat log) |

## Vault layout

```
vault/
  systems/muse-system.md     → Muse persona (canonical)
  systems/OWNERSHIP.md       → Write-lane contract
  projects/_registry.json    → Registered projects
  projects/{id}/backlog.json → One file per project
  projects/_archive/         → Archived project folders
  conversations/{date}.jsonl → Append-only chat log
  MEMORY.md, NORTH_STAR.md   → User identity (hand-edited)
  people/*.md                → Contacts
```

## Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Muse (Claude Sonnet 4.6) |
| `GROQ_API_KEY` | Voice transcription |
| `GITHUB_TOKEN` | Vault writes via Contents API |
| `CHIEF_AUTH_TOKEN` | Shared secret the frontend sends as `X-Chief-Token` |

## Local dev

No local dev server required. Edit, commit, push — Vercel preview URLs follow automatically.

## History

The original build used a push model: morning brief, daily queue, EOD narrative. Retired 2026-04-21 in favor of the pull model above. See `vault/systems/muse-system.md` for the current Muse spec and `CLAUDE.md` for the orientation doc aimed at AI coding agents.

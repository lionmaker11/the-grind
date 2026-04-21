# TheGrind — Claude Context

## What This Is

Personal command-center PWA for one user: T.J.

- **Frontend**: `index.html` (monolithic; active rewrite in separate chat).
- **Backend**: Node ESM serverless functions under `/api/`, hosted on Vercel.
- **Source-of-truth vault**: the repo itself. Everything the app reads/writes is version-controlled under `/vault/`.

---

## Current Model (post-2026-04-21)

### Retired — do not recreate

- Morning briefs, daily queue, EOD narrative, `.claude/routines/`, Hermes.
- `chief-briefing.md`, `today.json`, any daily queue surface.

### Active

- **Muse** is the only agent. She lives behind `POST /api/chief`. She manages project backlogs and the project registry — nothing else.
- **Frontend on open**: shows top 3 pending tasks per active project, sorted by priority 1–5 (1 = highest). Source: `GET /api/backlog` summary.
- **Pomodoro flow**: user picks tasks from backlogs and runs timers.
- **User → Muse**: text or voice (transcribed via `POST /api/transcribe`). User adds, reprioritizes, completes, or archives tasks. Every new task gets a priority; Muse asks one clarifying question if the user didn't state one.
- **Biweekly priority review**: Muse initiates on her first turn on Sunday or Thursday (America/Detroit).

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/chief` | Chat with Muse. Returns `{ text, actions[] }`. |
| `POST /api/transcribe` | Groq Whisper. Body: `{ audio, mimeType }`. Returns `{ text }`. No auth required. |
| `GET /api/backlog` | Summary of all active projects. Add `?project_id=X` for full backlog. |
| `POST /api/backlog` | Backlog CRUD. Ops: `add`, `remove`, `set_priority`, `complete`, `reorder`, `load`. |
| `POST /api/project` | Project CRUD. Ops: `add`, `archive`, `activate`. |
| `POST /api/sync` | Append-only. Only supported type: `conversation_append`. |

---

## Auth

Every endpoint **except** `POST /api/transcribe` requires:

```
X-Chief-Token: <value of process.env.CHIEF_AUTH_TOKEN>
```

Do not rename `CHIEF_AUTH_TOKEN` or `X-Chief-Token` unless T.J. explicitly requests it (retained for migration simplicity).

---

## Repo Layout

```
/api/                          Vercel serverless functions
  _lib/vault.js                Shared reads: registry, backlog, muse-system; defines ID_PREFIX map
  chief.js                     Muse chat endpoint
  backlog.js                   Backlog CRUD
  project.js                   Project CRUD
  sync.js                      conversation_append only
  transcribe.js                Voice → text (Groq Whisper)

/vault/                        Knowledge vault — version-controlled source of truth
  systems/muse-system.md       Canonical Muse persona
  systems/OWNERSHIP.md         Write-lane contract (read this before touching vault files)
  systems/the-grind.md         RETIRED — old spec, banner'd
  systems/thegrind-build-spec.md  RETIRED
  projects/_registry.json      All projects (active + inactive)
  projects/{id}/backlog.json   One backlog file per project
  projects/_archive/           Archived project folders
  conversations/{date}.jsonl   Append-only chat log
  people/*.md                  Contacts
  MEMORY.md                    T.J.'s identity — never edit
  NORTH_STAR.md                T.J.'s north star — never edit

index.html                     Current frontend (being rewritten)
sw.js                          Service worker (PWA)
manifest.json                  PWA manifest
vercel.json                    Hosting config
CLAUDE.md                      This file
```

---

## Write Lanes

### Claude MAY write

- `vault/projects/{id}/backlog.json`
- `vault/projects/_registry.json`
- `vault/conversations/{date}.jsonl`
- Any file under `/api/`
- Any file under `/vault/systems/` — only when explicitly told
- Config files at repo root (`vercel.json`, `package.json`, etc.)

### Claude MUST NOT write

- `vault/MEMORY.md`
- `vault/NORTH_STAR.md`
- `vault/projects/{id}/STATUS.md`
- `vault/people/*`
- `vault/projects/_archive/*`

When uncertain, ask T.J. before writing.

---

## Key Conventions

- **Task priority**: integer 1–5; 1 = highest urgency.
- **Task IDs**: per-project prefix + 3-digit sequence (e.g., `pal-001`, `tg-014`). Prefixes are defined in `api/_lib/vault.js` as `ID_PREFIX`. Never invent a prefix — use only what's there.
- **Project IDs**: pull from `vault/projects/_registry.json`. Never invent one.
- **Schema version**: every JSON file in vault has `"schema_version": 1`.
- **Timezone**: `America/Detroit` for all day-of-week logic (biweekly review, conversation dating).

---

## Active Projects (as of 2026-04-21)

Active:
`708-pallister`, `fast-track-uig`, `lionmaker-kettlebell`, `lionmaker-systems`, `va-disability`, `grillahq`, `alex-buildium`, `the-grind`, `biggerspreads`, `lionmaker`

Inactive:
`motor-city-deals`, `marcus`, `mcd-agent-org`

Always verify against `vault/projects/_registry.json` — this list may drift.

---

## Do Not Do

- Recreate retired surfaces: `chief-briefing.md`, `today.json`, daily queue, `.claude/routines/`.
- Invent project IDs or task ID prefixes not present in the registry or `vault.js`.
- Rename `CHIEF_AUTH_TOKEN` / `X-Chief-Token` unless explicitly asked.
- Commit and push without confirming with T.J. when the change is nontrivial or destructive.
- Edit `vault/MEMORY.md`, `vault/NORTH_STAR.md`, or anything under `vault/people/` or `vault/projects/_archive/`.

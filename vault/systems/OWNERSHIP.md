# Vault Ownership Contract

Muse is the sole operator of this vault. Hermes is retired.

## Muse (operator, lives behind /api/chief)

Owns:
- `vault/projects/{id}/backlog.json` — per-project backlog (add, remove, reorder, set_priority, complete)
- `vault/projects/_registry.json` — project registry (add, archive, activate, `last_touched`)
- `vault/conversations/YYYY-MM-DD.jsonl` — rolling chat transcript (appended by the frontend after every Muse turn)

Reads everything. Writes only the above.

## Read-only for Muse

- `vault/MEMORY.md`, `vault/NORTH_STAR.md` — identity + priorities (T.J. edits by hand)
- `vault/systems/*.md` — specs, including this file (T.J. edits by hand)
- `vault/projects/{id}/STATUS.md` — long-form project notes (T.J. edits by hand)
- `vault/people/*.md` — contacts / context
- `vault/projects/_archive/` — archived project folders (preserved, not touched)

## Schema versioning

Every JSON file under `vault/` carries `schema_version: <int>`. Bump on breaking change. Muse refuses to write against an unknown version.

## Retired surfaces (do not recreate)

- `chief-briefing.md` — deleted. No morning brief.
- `today.json` — deleted. No daily queue.
- `vault/daily/` — deleted. No daily files.
- `vault/daily-briefs/` — deleted. No narrative briefs.
- `results/YYYY-MM-DD.json` — unused; EOD snapshots are gone.
- `.claude/routines/` — deleted. No scheduled jobs; all intelligence is reactive via chat.

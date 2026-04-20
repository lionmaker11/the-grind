# Vault Ownership Contract

Two agents write to this vault. To prevent conflicts and drift, each path has exactly one owner. Do not cross the line without a migration note.

## Muse (operator, lives in The Grind app)
Owns:
- `vault/daily/YYYY-MM-DD.json` — today's queue (source of truth once written)
- `vault/daily-briefs/grind/YYYY-MM-DD.md` — Muse's EOD narrative brief
- `vault/projects/{id}/backlog.json` — per-project backlog (Muse adds, T.J. edits via voice)
- `vault/conversations/YYYY-MM-DD.jsonl` — rolling chat transcript
- `vault/projects/_registry.json` — updates `last_touched`, never `status` without T.J. approval

Reads everything. Writes only the above.

## Hermes (strategist, lives on T.J.'s laptop)
Owns:
- `chief-briefing.md` — legacy daily brief (being sunset; Muse takes over by Week 4)
- `vault/projects/{id}/STATUS.md` / `{id}-status.md` — long-form project notes
- `vault/MEMORY.md` / `vault/NORTH_STAR.md` — identity + priorities
- `vault/systems/*.md` — specs, including this file
- `vault/projects/_registry.json` — owns `status` field (active/inactive classification)

Reads Muse's daily + briefs. Writes everything above.

## Shared read-only
- `vault/projects/{id}/STATUS.md` — Muse reads for project context but never writes
- `vault/MEMORY.md`, `vault/NORTH_STAR.md` — Muse reads every turn but never writes

## Conflict rule
If both write the same path, the last write wins locally and the loser opens a PR with the diff. No silent overwrites.

## Schema versioning
Every JSON file under `vault/` carries `schema_version: <int>`. Bump on breaking change. Muse refuses to write against an unknown version.

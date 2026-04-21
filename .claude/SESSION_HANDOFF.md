# Session Handoff — 2026-04-21

Working branch: `claude/continue-building-1jGnR`
All work pushed to origin.

## Muse's role (locked in this session)
Muse maintains TheGrind app. That's it. She does NOT push narrative briefs, Telegram messages, or emails. T.J. voice-dumps into the app → Muse intakes, interprets, delegates items to the correct queue/backlog, and asks one tight clarifying question when routing is genuinely ambiguous. Reminders to voice-dump come from the app at start/end of day.

Everything that used to produce a report for T.J. now mutates app state instead.

## What shipped

1. **`api/_lib/vault.js`** — shared helper: `readRegistry`, `readBacklog`, `readMuseSystem`, `getActiveProjects`, `getAllProjectIds`, `getBacklogSummary`, `renderBacklogsText`, `nextTaskId`, `ID_PREFIX`. `_lib/` is Vercel-ignored (leading underscore), safe to sit under `/api/`.

2. **`api/chief.js`** refactored: system prompt is now `readMuseSystem()` + app-specific tool section. Project-ID enum in the tool schemas is generated from the registry at request time — add a project to `_registry.json` and it's callable without a code change. `loadBacklogSummary` / `renderBacklogs` pulled out to the helper.

3. **`api/backlog.js`** refactored to import from `_lib/vault.js`. No behavioral change.

4. **`api/sync.js`** — new `type: "conversation_append"` handler. Appends JSONL lines to `vault/conversations/{date}.jsonl` via GitHub contents API, same pattern as `results` and `update_today`. Unblocks the EOD routine's transcript-read.

5. **`vault/systems/muse-system.md`** rewritten to the intake-only role. Explicit "What You Do NOT Do" section and intake/clarification rules.

6. **`.claude/routines/morning.md`** and **`.claude/routines/eod.md`** rewritten. Both are now silent file-mutators:
   - `morning.md` writes `vault/daily/{today}.json`. No voice-over. Single log-line output.
   - `eod.md` reconciles the queue in-place, files transcript captures to project backlogs with duplicate-guard, bumps `last_touched` in the registry. No markdown brief. `vault/daily-briefs/grind/*.md` is retired.

7. **`vault/projects/_registry.json`** — added `the-grind` as `status: "lightweight"` (meta backlog for the app itself; on-demand only, not in daily rotation).

8. **Schema audit** — every `vault/projects/*/backlog.json` now carries `schema_version: 1` (was missing from all 9 files).

9. **Cleanup** — loose files relocated:
   - `vault/projects/lionmaker-systems-status.md` → `vault/projects/lionmaker-systems/STATUS.md`
   - `vault/projects/agentsidehustle-status.md` → `vault/projects/agentsidehustle/STATUS.md`
   - `vault/projects/aurelia-spring-break-2026.md` → `vault/people/aurelia-spring-break-2026.md`

## Still to do

### P0 — wire Week 2 (manual, in claude.ai/code)
- Wire `morning.md` at Sonnet 4.6, 06:00 America/Detroit, Mon–Sat.
- Wire `eod.md` at Sonnet 4.6, 17:30 America/Detroit, Mon–Sat.
- Start on a Monday so the day-to-day chain starts clean.

### P1 — frontend wiring (needs browser testing)
- Wire `index.html` Muse chat to POST `{type:"conversation_append", payload:{date, lines:[{ts,role,content},...]}}` to `/api/sync` after each turn. Append just the two new messages (user + assistant). Without this, the EOD routine has no transcript to read.
- Verify Re-Entry Mode UI still works end-to-end after the chief.js refactor (persona change is server-side only, but worth a smoke test).

### P2 — code hygiene
- Rename `X-Chief-Token` → `X-Muse-Token` across `index.html`, `api/chief.js`, `api/sync.js`, `api/backlog.js`, `api/re-entry.js`, `api/transcribe.js`, `api/today.js` and the Vercel env var. Coordinated change; touches deploy.
- Rename internal `chief*` CSS classes / function names in `index.html` to `muse*`. Cosmetic, can wait.
- Delete `chief-briefing.md` + its read in `chief.js` / `vercel.json` once Hermes is retired (Week 4).

### P3 — product
- **Stray project folders** in `vault/projects/` not registered: `agent-side-hustle`, `agentsidehustle`, `ai-baseline`, `ai-business-survey`, `animalfamilyfrenzy`, `biggerspreads`, `chief-workspace`, `infrastructure`, `lionmaker`, `mls-bot`, `new`, `polytrade`, `purchase-agreement-exporter`, `real-estate-calculator`, `trish-paints-joy`, `wholesale-purchase-agreement-export`, `whop-saas-building`. Each needs: register, archive to `vault/projects/_archive/`, or delete. Needs T.J. input.
- **Per-project backlog read-only UI** inside TheGrind app (skim top 5 per project without opening JSON).
- **`sunday-review.md`** — author when Week 2 has ~5 days of morning+EOD data to reason over. Weekly queue reset across active projects; writes to `vault/daily/{monday}.json` pre-generated for Monday morning.
- **`midday.md`** — only if Week 2–3 data shows mid-day stall. Haiku 4.5, cheap nudge-if-silent check.

## Constraints (do not violate)
- **OWNERSHIP.md is binding.** Muse writes: `vault/daily/`, `vault/conversations/`, `vault/projects/{id}/backlog.json`, `_registry.json.last_touched`. Everything else is Hermes or read-only.
- **No new surfaces.** `vault/daily-briefs/grind/*.md` is retired. Do not bring it back without T.J. approval.
- **90-day fade is tracked via `last_touched`, not chat.** Muse flags silent projects by bumping the field; she does not push alerts.
- **Sofia born 2026-04-09.** Re-entry mode remains primary until T.J. signals he's back in rhythm.

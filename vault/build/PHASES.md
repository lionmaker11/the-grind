# TheGrind V2 — Build Log

Authoritative record of phase-by-phase state, approved exceptions, and patterns
observed during the rebuild. Read this file first in any new Claude Code
session before touching code.

## Current state (23 April 2026)

- Production: the-grind-gold.vercel.app (main branch, HEAD 73c7dd2)
- Active branch: v2-phase4 (HEAD 892ff9b, 41 commits ahead of main — mid-rebuild)
- Architecture: V2 served at `/` via Vite build at `v2/dist/`, `/api/*` same-origin, all Vercel serverless functions
- Lighthouse accessibility baseline: 100/100 (Phase 2 close, holds)

Phase 4 onboarding is mid-rebuild. The initial 3-question implementation (commits f4fc3ba through c928abf) was phone-tested on 22 April 2026 and surfaced blocking issues: 4× POST /api/project returned 409 on LOCK IT IN (slug collisions between Opus-extracted project names and the existing vault registry); weak question phrasing producing poor extraction quality; broken project-task coupling across Q1/Q2/Q3 turns.

A design council (Council 1: David_Allen_Methodologist, Julie_Zhuo_Designer, Ryan_Singer_Scope, Tobi_Lütke_Operator, Voice_UX_Researcher) redesigned the flow: single capture question + optional clarify + extended review with MATCH indicators and orphan handling. A second council (Council 2) produced the R5b flow redesign governing the current review-surface rebuild. Concurrent with the redesigns, a simplification pass removed P1/P2/P3 priority badges app-wide, removed aspirational due-date/overdue meta chips, and replaced the 1-5 priority scale with a binary urgent flag + universal drag-to-reorder ordering.

Canonical rebuild specs: /vault/build/phase4-redesign-spec.md (Council 1, landed in 03fe71a) and /vault/build/phase4-flow-redesign.md (Council 2). Living open-items register: /vault/build/phase4-open-items.md. Session handoff doc: /vault/build/phase4-session-handoff.md.
Design asset set: /design/mockups/ (full replacement in f56f5e0 — 30 active screens + shared.css + tokens.css + 3 assets, reflecting the simplification pass).

Current step: R5b OnboardReview rebuild underway. R5b-1 through R5b-6a landed (see Phase 4 roadmap bullet). Next: R5b-6b₁ (drag wiring). Original commits 5448a95, 05ceba8, 285b1c9, c928abf preserved as branch archaeology. No force-push, no history rewrite.

## April 2026 simplification pass

Concurrent with the Phase 4 redesign, a product-level simplification removed three layers of decoration and elevated a single interaction to universal status:

- **P1/P2/P3 priority badges removed app-wide.** Priority becomes implicit: position in a sorted list IS priority. Data model keeps an integer sort field but becomes invisible to the user.
- **Due-date/overdue meta chips removed.** "14+ DAYS OVERDUE", "DUE FRI", "N DAYS QUIET" — these never existed in the backend data model. Aspirational design, cut until the feature lands (deferred to Phase 9 or 10).
- **Binary urgent flag** replaces 1-5 priority granularity. `urgent: boolean` per task. Amber left-rail accent on urgent rows. "N URGENT / TOTAL" count in project head. Long-press 500ms gesture to toggle. Opus initializes `urgent` from language cues at extraction; Muse can toggle via voice ("make X urgent", "clear urgent from Y").
- **Drag-to-reorder elevated to universal priority mechanism.** Used across onboard review and Phase 5b Backlog detail. Implemented once, reused everywhere tasks appear in an ordered list.

Impact on phase scopes:
- Phase 5b scope tightens: drag-to-reorder moves from Phase 8 polish into Phase 5b primary work. Phase 8 loses drag-and-drop (shifted forward). Net zero total work, resequenced.
- Phase 4 review screen loses P-badges and up/down priority arrows.
- All Focus/Muse/TopBar surfaces updated to speak binary urgent instead of priority integers.

Data model changes captured in phase4-redesign-spec.md: task schema adds `urgent: boolean`, adds `order: integer`, removes `priority: 1-5`. `/api/backlog.js` gets new op `toggle_urgent`.

## Stack lock (non-negotiable)

- **Frontend:** Preact + Vite + nanostores + vanilla CSS
- **Backend:** Vercel serverless functions, ESM throughout, Node 18+
- **Models:** Anthropic (Sonnet 4.6 + Opus 4.7), Groq Whisper for transcription
- **Forbidden:** React, TypeScript, Tailwind, CSS-in-JS, component libraries,
  routers, state libraries other than nanostores, animation libraries, audio
  libraries, WebSocket libraries

## API rules

`/api/*` and `/vault/*` are frozen by default. Exceptions require explicit
user approval and a "show me the diff" review before any commit.

### Approved exceptions

1. **`api/backlog.js` summary includes `last_touched`** (Phase 1, commit
   `533dafe`) — needed for heartbeat dot rendering.
2. **Root `package.json` `"type": "module"`** (Phase 1, commit `ee443bd`) —
   prevented Vercel's ESM→CJS compilation from silently breaking
   `import.meta.url` in serverless functions.
3. **`api/chief.js` mode routing + prompt caching + logging** (Phase 3) —
   explicit per-intent model routing, Anthropic prompt caching on stable
   system head, per-request JSON logs for observability.
4. **`api/backlog.js` + `api/chief.js` GET handlers read from GitHub**
   (Phase 3, commit `9ec8f31`) — closes read-after-write consistency bug
   where GET handlers read from the bundled vault snapshot (frozen at deploy)
   while POST handlers wrote to GitHub directly. Muse-filed tasks were
   invisible until next deploy. See Pattern 1.

Phase 4 rebuild exceptions (landed):

- **Exception 5** (landed in 229e65c): `api/chief.js` onboard-mode prompt assembly injects the user's existing project registry into the system prompt so Opus can detect matches. Minor logic change within the existing mode-routing scope (Exception 3) but flagged separately because it changes prompt composition, not just routing.
- **Exception 6** (landed in R3 commits): `api/backlog.js` op `toggle_urgent` — single-field mutation handler, same endpoint as existing op=add. Covered by the existing `op` routing pattern (Phase 1 endpoint scope) rather than a true exception.
- **Exception 7** (landed in R5b-2): `api/backlog.js` op `add` accepts `order: 'append'` sentinel to place a new task at the end of an existing project's backlog. Needed by the commit orchestrator for merge-append (see open-item #1). Within existing op-routing scope; reviewed pre-commit.

Each /api/* edit during the rebuild requires explicit diff review before commit. Five approved to date (plus two rebuild-internal additions within existing routing scope).

## Model routing (locked)

```js
// api/chief.js
const MODELS = {
  muse:    'claude-sonnet-4-6',   // daily voice loop (Phase 3)
  onboard: 'claude-opus-4-7',     // multi-project extraction (Phase 4)
  recap:   'claude-opus-4-7',     // weekly review (later)
  default: 'claude-sonnet-4-6'
};
```

Frontend sends `mode` per intent. No auto-escalation. Prompt caching mandatory
on the stable system head (persona + APP_CONTEXT_PROMPT + tools).

## Muse store shape (locked, Phase 3)

```js
{
  isOpen,
  messages,          // [{ id, role: 'user'|'muse'|'action', content, ts, variant? }]
  isRecording,
  isTranscribing,    // audio → text
  isSending,         // text → chief response
  isOnline,
  voiceText,
  status,            // 'idle'|'listening'|'transcribing'|'thinking'|'response'|'error'|'offline'
  lastAction,
  lastActionAt,
  prefill
}
```

## Heartbeat thresholds (DESIGN.md §4)

| Age           | Color          | Animation            |
| ------------- | -------------- | -------------------- |
| `null`        | dim gray       | none                 |
| 0–3 days      | green          | none                 |
| 3–7 days      | yellow         | none                 |
| 7+ days       | red            | 2s ease-in-out pulse |

## Parallelism rules

- **Default:** sequential single Sonnet session
- **Allowed fan-out:** CSS after structural JSX (Phase 2), onboarding mockup
  fidelity (Phase 4), Ring SVG port (Phase 6), PWA assets vs SW (Phase 7),
  test-writing, visual QA
- **Forbidden:** Phase 1, Phase 3 voice loop, Phase 8 polish, any state store
  authoring, any files with cross-imports
- **Fan-out protocol:** ephemeral sub-branches, Opus integrates single commit,
  no force-pushes, each Sonnet verifies `git rev-parse --abbrev-ref HEAD` +
  clean tree before starting

## Phase history

### Phase 0 — Prep
Deleted V1 monolith. Kept `/api/`, `/vault/`, `/design/mockups/`, `/vercel.json`.
Known ghost: V1 service worker still haunts browsers that installed the PWA.
Clear manually via DevTools → Application → Service Workers → Unregister.

### Phase 1 — Foundation scaffold (merged)
Scaffold renders live `/api/backlog` JSON in `<pre>` block. Single Vercel
project, V2 at `/` via `buildCommand: "cd v2 && npm install && npm run build"`.

### Phase 2 — Board read-only (merged)
Bundle: 7.99 KB JS gz + 3.14 KB CSS gz. Three states: default, empty, offline.
Re-entry deferred to Phase 3. DESIGN.md §4 patched with null-heartbeat rule.

### Phase 2 a11y cleanup (merged)
Lighthouse a11y 87 → 100. aria-labels, landmarks, focus-visible rings,
text-muted alpha 30 → 60%, text-dim alpha 55 → 60%, maximum-scale=1 removed,
pseudo-element focus ring on clipped EXECUTE button.

### Phase 3 — Voice loop (merged 2026-04-21)
Muse FAB → sheet → mic → transcribe → chief → tool call → vault write →
Board re-fetch. Validated on iPhone: voice → task on Board in <10s, Muse
in character, Sonnet 4.6 handling intent mapping correctly.

**Final commits (main..v2-phase3, oldest first):**
- `7b3b850` — chief.js mode routing + prompt caching + per-request logging
- `38f81ac` — voice loop frontend (muse store, voice.js, Muse components, Board
  FAB, TopBar lastAction); Playwright E2E
- `66832cc` — iOS Safari Groq Whisper compatibility (mp4 → m4a filename rename)
- `b5f7968` — redeploy after re-scoping GROQ/ANTHROPIC/GITHUB/CHIEF env vars
  off stale `v2-prep` branch onto all-previews
- `a25cd2d` — redeploy after stripping literal `\n` from ANTHROPIC_API_KEY
- `9ec8f31` — /api/* GET handlers read from GitHub (read-path consistency fix)
- `4f4012b` — PHASES.md build log + scripts/verify-env.js utility

**Validation record:** Validated end-to-end on iPhone Safari 21 Apr 2026 —
voice → Muse response → task on Board in <10s.

**Bundle metrics (after `38f81ac`):** JS 30.21 KB (11.38 KB gz), CSS 18.21 KB
(4.26 KB gz). Well under 50 KB JS / 20 KB CSS budget.

**Latency (after `9ec8f31`):** ~360ms median for 12-project summary fetch
(13 parallel GitHub Contents GETs vs. previous bundled-read snapshot).

## Phase roadmap

- **Phase 4 — Onboarding rebuild.** Mid-rebuild after phone test revealed blocking issues in the original 3-question implementation. Redesigned flow per Council 1 output (22 April 2026): single capture + optional clarify + extended review with MATCH/orphan handling. Binary urgent flag replaces P-badges. Canonical spec: /vault/build/phase4-redesign-spec.md. Original commits on v2-phase4 (5448a95, 05ceba8, 285b1c9, c928abf) preserved as archaeology; rebuild will supersede them without force-push.

  R5b underway since 23 April 2026. R5b-1 through R5b-6a landed: extraction prompt conservative-binding (R5b-1), api/backlog.js order:'append' sentinel (R5b-2), copy refresh across non-review onboarding components (R5b-3), OnboardError variant routing (R5b-3b), OrphanPicker component (R5b-4), OnboardReview structure + render (R5b-5, commit cf18a75), OnboardReview simple store-action wiring (R5b-6a, commit 892ff9b). Council 2 spec at vault/build/phase4-flow-redesign.md governs the overall R5b flow. Remaining R5b steps: R5b-6b (complex interactions — drag, contentEditable, long-press, orphan picker mount, deleteProject orphan-conversion; split into b₁ drag and b₂ edit/longpress/orphan clusters), R5b-6c (commit orchestrator — order:'append' frontend wiring + mid-commit abort guards), R5b-7 (drag utility upgrade if needed post-R5b-6b), R5b-8 (Playwright E2E rewrite), R5b-9 (pre-merge status report), phone test, merge.
- **Phase 5a — Board interactions.** Check-off, launch to Focus stub, ghost-row wiring. Priority changes happen via drag (simplification pass made drag universal) — Board top-3 derives from backlog order. Pending.

  Known polish before merge:
  - **Drag-reorder race with concurrent fetchBoard** — Codex flagged during 5a-7 review: the drag controller stores fromIdx/toIdx from pointer-down through pointer-release; if fetchBoard or another mutator changes top[] mid-drag, the reorder applies stale indices to fresh data and could move the wrong task. Defensive bounds check in ProjectCard catches the list-shrunk case. Full fix requires drag.js extension (onDragStart callback) which would ripple to OnboardReview — out of scope for 5a-7. Log here for phone test (5a-10) verification: if wrong-task-reordered behavior surfaces in real use, address in a dedicated commit before 5a-11 merge. Otherwise ship and revisit in Phase 6+ if needed.
  - **Ghost-row drop indicator** — original 5a-8 deferred during reading pass. phase5a-spec.md Decision 6 is internally inconsistent (prose describes pointer-following; linked mockup shows stationary-at-origin). Implementing either requires picking one over the other arbitrarily, AND for a 3-row top-3 list the existing drag feedback is already informative. Verify need via phone test (5a-10); implement based on observed user confusion if any, or close as no-fix if not. See phase5a-spec.md Decision 6 for full rationale.
- **Phase 5b — Backlog detail + pom glyphs.** Modal overlay launched from Board project tap. Full task list with URGENT/NORMAL grouping, drag-to-reorder primary priority mechanism, inline pomodoro estimate glyphs, aggregate pom counter in header. Mockups 23 (detail), 24 (glyph study), 33 (reorder + urgent storyboard) in /design/mockups/. Scope tightened by simplification pass: drag-to-reorder (previously Phase 8 polish) now primary Phase 5b work. Depends on Phase 4 rebuild merging first and Phase 5a shipping the basic interaction primitives.
- **Phase 6 — Focus surface + Ring timer.** Port sacred SVG from mockup 06.
- **Phase 7 — PWA manifest + service worker + iOS install.** Killswitch SW
  to clean up V1 ghost.
- **Phase 8 — Dogfood + polish.** V2 already live at `/`; Phase 8 is real
  use + polish items accumulated from phone tests.

## Future considerations

Forward-looking work items committed to V2 ship but not yet placed in a specific phase. Filed here so they survive across sessions and don't get lost in chat history.

**Motion polish — final sweep before V2 ship.** V2 currently has
binary state transitions throughout (instant mount/unmount,
immediate appear/disappear, snap reorders). The app feels rigid.
A dedicated motion-polish pass smooths every surface as the final
step before V2 is considered shipped.

Not gamification, not dopamine architecture, just craft. Target:
the app flows between states rather than snapping.

Scope (non-exhaustive — to be expanded as surfaces are built):
- Row fade-out on ✓ tap (~200ms ease-out)
- Board ↔ Focus transition (currently jarring mount/unmount)
- Sibling-row settle animation after drag-release
- Header count number tweens (urgent/total animate up/down rather than swap)
- Project card expand/collapse if Phase 5b adds Backlog detail
- Onboard step transitions (currently snap between drive-states)
- Focus surface state transitions once Phase 6 builds the real one
- Any other surface added in Phase 6, 7, 8 — all in scope for the final sweep

Timing: AFTER all functional V2 phases ship. This is the last pass before V2 is declared shipped. Doing it earlier means re-doing it each time a new surface lands. Doing it last means one comprehensive sweep with the full app in front of us.

Implementation: CSS transitions + transform animations primarily. Possible useTransition/AnimatePresence-equivalent for Preact if needed for mount/unmount transitions. Low JS-state-machine change.

Not deferred or optional — committed deliverable for V2 ship. If
V2 ships without this pass, V2 isn't fully shipped.

## Patterns observed during the build

### Pattern 1 — `/api/*` frozen rule keeps surfacing pre-existing bugs

Five approved to date plus two rebuild-internal additions (api/chief.js registry-injection landed in 229e65c; api/backlog.js toggle_urgent op landed in R3; api/backlog.js order:'append' sentinel landed in R5b-2). Review each diff before commit. None are scope creep; all are V1 bugs that had been silently broken or known Phase 4 rebuild work. The frozen rule did its job by forcing explicit review of each backend touch, which surfaced the bugs instead of letting them compound.

**Implication:** Expect more of these in Phases 4-7 as new surfaces exercise
the backend. Budget 1-2 small `/api/*` exception commits per phase.
Don't treat them as scope drift.

### Pattern 2 — Environment variable corruption is common

Three env var bugs to date:
1. `GITHUB_TOKEN` trailing newline (pre-build)
2. `GROQ_API_KEY` branch-scoped to stale branch (Phase 3)
3. `ANTHROPIC_API_KEY` literal `\n` characters baked into value (Phase 3)

**Root cause:** Copy-paste into Vercel's dashboard or CLI introduces invisible
corruption. Trailing whitespace, literal `\n` encoding, scope mismatches.
Bugs don't surface until the API call fails with a confusing error.

**Mitigation:** Run `scripts/verify-env.js` any time a key is rotated, a
new branch is deployed, or a confusing auth error appears.

### Pattern 3 — The phone test is irreducible

Every material bug in Phase 3 was caught by the real-device phone test, not
by desktop testing, Playwright mocks, or code review:
- iOS MediaRecorder mime mismatch (Groq rejected mp4)
- Groq env var scope bug
- Anthropic env var `\n` corruption
- Read-after-write consistency bug

**Rule:** Every Phase 4-8 requires a real-device phone test against the
preview URL before merge. No exceptions. Desktop Playwright green is
necessary but not sufficient. Budget 10-15 min of user attention per
phase gate.

**Polish punch list:** Every friction point noticed during a phone test
goes on a post-phase polish list. Don't ignore — polish debt compounds.

Known polish items from Phase 3 phone test:
- iOS EXECUTE button renders `▶` as emoji, not text glyph
  (fix: `font-variant-emoji: text` or inline SVG)
- Muse FAB is hard to reach with left-hand thumb at 56px
  (consider 64-72px or pull-up gesture)
- Task text truncation → handled by two-line wrap treatment (design/mockups/35-board-task-wrap.html), lands in Phase 5a
- Long project names truncate (e.g. LIONMAKER KETTLEBELL APP → KETTLEBEL...).
  Lower severity — project name is identifier, full text is in individual
  tasks.

## Critical rules (repeat for every Claude session)

- **"Show me the diff"** for any `/api/*` change
- **Bundle budget enforced:** JS < 50 KB gz, CSS < 20 KB gz, reported after
  every commit
- **Stop-and-ask** on stack drift, new UI surfaces, new files outside the
  approved tree, any `/api/*` or `/vault/*` changes
- **No force-pushes. Ever.**
- **No partial-infrastructure commits** — phases either work end-to-end at
  commit time or the commit isn't made
- **Opus reviews** at critical-path gates and parallel integrations
- **Incognito browser** for visual verification (V1 service worker ghost is real)
- **Phone test required** at Phase 4-8 gates

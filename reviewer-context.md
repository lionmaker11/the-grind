# Reviewer Context

Strategic context, quality standards, council composition guidance, and accumulated review learnings for `the-grind` V2 rebuild. Read by Dev Loop Protocol's Session Start (Step 3) and Phase 4 (Council Assembly).

## Project Domain

Solo-operator personal voice-first PWA. Single-user single-tenant task/project management. Daily-driver tool that organizes T.J.'s real life across 7+ ventures (the-grind itself, MARCUS, MCD/Motor City Deals, 708-Pallister real estate, Lionmaker brand, Pallister property, defi-cockpit, etc.).

Domain expert specialist for council assembly: **Daily-driver-tool product specialist** — someone who understands the workflow risks of breaking the user's own daily tool. The user IS the QA team; if a regression slips through, the user's day is broken.

## Risk Profile

- **Vault corruption risk** — `vault/` directory is GitHub-backed source-of-truth for real life-organizing data (not test data). Bad writes corrupt real state. Always seat a data-integrity specialist when vault writes are touched.
- **iOS Safari overlay quirks** — Phase 5a-10 spent 3 followups debugging Focus blank-screen before landing on `position: fixed` + `100vh` + `100dvh` + explicit background. Always seat a mobile-web specialist when overlay/modal/full-screen surfaces change.
- **Single auth mechanism** — `x-chief-token` header. No OAuth, no multi-tenant logic. Don't propose auth complexity.
- **`/api/*` serverless functions** — Vercel-hosted; write to GitHub Contents API. Historically frozen-by-default (Pattern 1). Dev Loop now governs new exceptions via codex review cadence.
- **iPhone-only deployment target** — Desktop UX doesn't matter; desktop Playwright is the dev verification surface, phone is truth. Tier 3 (manual phone test) is the final gate before merge.
- **Long-press text-selection conflict** — iOS Safari fires native context menu concurrently with longpress unless `user-select: none; -webkit-touch-callout: none` is set on the gesture target.

## What This Project Is

TheGrind V2 rebuild — Preact + Vite + nanostores + vanilla CSS PWA at https://the-grind-gold.vercel.app.

**Surfaces:**
- **Board** — project cards (top-3 tasks each, urgent-first sort, drag-reorder, EXECUTE button)
- **Onboard** — voice multi-project capture via Muse (capture/clarify/parsing/review + error variants + OrphanPicker)
- **Focus** — task work surface (Phase 5a stub; Phase 6 real Ring timer + pomodoro)
- **Muse** — always-on voice loop (per `vault/systems/muse-system.md`)
- **Backlog modal** (Phase 5b in progress) — full task list per project, drag-reorder, edit/check/delete

**Backend:** Vercel serverless `/api/*` (backlog, project, chief, transcribe, sync, upload) writing to GitHub Contents API at `vault/`.

**Stack lock (non-negotiable):** Preact + Vite + nanostores + vanilla CSS. No React, no TypeScript, no Tailwind, no component libraries.

## Architecture & Patterns

- **Optimistic-update + rollback convention** in nanostore mutators (boardStore 5a-4 established; backlogStore in 5b-3 inherits). Capture snapshot → compute optimistic immutably → write to store → await backend → on error: restore + set error + fetch authoritative state.
- **iOS Safari overlay pattern:** `position: fixed; z-index: 50; top:0; left:0; right:0; bottom:0; height: 100vh; height: 100dvh; padding-top: calc(var(--top-bar-h) + var(--s-4)); background: var(--bg);`
  - Never use `min-height: 100%` — requires explicit parent height that `#app` doesn't consistently provide
- **Drag composition:** `lib/drag.js` (8px engage threshold, window-level pointermove listeners) + `lib/longpress.js` (500ms hold, 8px move cancels). Both used together on TaskRow without gesture conflict.
- **Long-press targets** need `user-select: none; -webkit-touch-callout: none` to suppress iOS native context menu.
- **`/api/backlog.js` op-routing:** 8 mutating ops (add, remove, set_priority, toggle_urgent, complete, reorder, update_task_text, delete_task). All share latent `Promise.all([writeBacklog, touchRegistry])` race (BACKLOG.md item). Fix when surfaced should hit all 8 ops in one commit.
- **GET handlers read live from GitHub** (not bundled vault snapshot) — closes read-after-write consistency bug. See `fetchBacklogLive` / `fetchRegistryLive` in `api/_lib/vault.js`.
- **Council pattern:** Phase-level councils (Council 1, 2, 3 already deliberated Phase 4, 4-flow-redesign, Phase 5a) deliberate phase scope BEFORE sub-step implementation. Dev Loop's per-task Phase-4 council is additive — different cadence.
- **Codex review cadence:** Previously `/api/*`-only (Pattern 1 budget). Now codex review per Dev Loop Phase 2 on every change — broader cadence, lower per-touch ceremony.
- **Testid convention:** `<surface>-<element>-<id>` (e.g. `task-row-pal-015`, `backlog-task-text-pal-015`, `focus-back`, `backlog-modal-root`). Established in 5a-8 Playwright; carry forward.
- **Mock backend pattern:** `v2/tests/helpers/mock-backend.js` branches on `body.op`. Add new branches before the `op:add` fallback. Apply same normalization (trim/slice/etc) the real handler does so test assertions match production.

## Past Council Members That Added Value

- **2026-05-15 (5b-3):** Concurrency / Distributed Systems Engineer (adversarial) — caught that the generation guard solves modal-lifecycle races but NOT same-modal concurrent mutator races. Validated Codex Phase 2's deferred concern in concrete UX scenarios. Reinforced the "watch dogfood for resurrected/reverted tasks" trigger.
- **2026-05-15 (5b-3):** Daily-driver-tool product specialist — escalated the closed-modal silent-failure concern from "deferred" to "5b-6 must surface". Re-seat for any task surface where T.J. uses the tool 10+ times/day.
- **2026-05-15 (5b-3):** Mobile-Web / iOS Safari specialist — flagged the modal-with-Board-fetching backdrop-filter repaint cost. Re-seat for any modal/overlay work touching iOS Safari.
- **2026-05-15 (5b-3):** Frontend State Management Architect — flagged the `(args) => Promise<void>` mutator API inconsistency with normal Promise semantics. Decided to live with it (matches Phase 5a-4 boardStore convention).

## Cross-store sync conventions (established 5b-3)

Direction: **modal mutators → fetchBoard()** is the established cross-store sync pattern. Every successful backlogStore mutation calls fetchBoard() unconditionally to propagate to Board's top-3 summary. The generation guard suppresses the modal-store rollback write only — NOT the success-path fetchBoard.

Inverse direction (board → modal) is undefined. If Phase 6's Focus store ever mutates tasks while modal is mounted, it MUST decide whether to:
  (a) re-fetch backlogStore to refresh the modal
  (b) accept the modal's stale view until close

Default lean: (b) — modal sessions are short, cross-surface invalidation adds complexity for low-frequency conflict.

## Dogfood watch list (5b-3 council deferrals)

Watch for these reports during single-user dogfood; if any surfaces, the listed BACKLOG item triggers:

- **"Task I deleted came back"** OR **"Edit I made reverted"** → triggers concurrent-mutator-rollback fix (per-row lock or patch-based rollback). BACKLOG item.
- **"Modal scrolling is janky on iPhone"** OR **"Board flickered while I was editing"** → triggers fetchBoard debouncing + iOS profiling. BACKLOG item (loading flicker + GitHub API pressure entries).
- **"I deleted a task and there was no error but it stayed there"** → triggers closed-modal-failure surfacing (boardStore.error, toast, or inline retry). BACKLOG item.
- **"I made an edit and it never saved"** → 5b-6 implementation must surface save-failure visibly. NOT a BACKLOG item; this is a hard requirement for 5b-6 spec implementation.
- **"Muse FAB covers stuff in the backlog modal"** OR **"I keep tapping Muse by accident in the modal"** → triggers Muse-FAB hide-while-modal-open decision. Currently kept mounted per voice-first principle (Codex 5b-4 standard review flagged); flip to `!isActive && !openProjectId && <Muse />` in app.jsx if overlap surfaces. The bottom-right corner of the modal is where mockup 23 places the `+ ADD TASK` affordance (5b-5+ scope) — overlap with FAB is plausible.

## Pattern promotion candidates

- **`assignBucketedPriorities` / `sortByPriority` triplication** — same logic now duplicated in `api/_lib/vault.js`, `v2/src/state/board.js`, and `v2/src/state/backlog.js`. Three copies of bucket math + urgent-first sort. YAGNI threshold passed. Promote to `v2/src/lib/sort.js` when a fourth caller appears (likely Phase 6 Focus surface). Logged as a backlog item below.

- **Modal overlay pattern (Focus, BacklogDetail, MuseSheet, OnboardExitConfirm)** — `position: fixed; inset: 0; height: 100vh; height: 100dvh; z-index: N; padding-top: var(--top-bar-h); background: var(--bg);` is now established across 4 surfaces. Reusable as a CSS class `.modal-overlay` or a component primitive when a 5th surface lands.

  **IMPORTANT (Accessibility Engineer, 5b-4 council):** A11y deferrals are NOT part of the reusable pattern. Each new modal surface must re-decide: focus management on mount/close, Escape handler, inert background for assistive tech, aria-live for dynamic counts. BacklogDetail ships these as deferred per voice-first + iPhone-only context; do NOT copy the deferral by default when implementing a new modal surface.

## Stacked-surface lifecycle ownership (established 5b-4)

When a top-precedence surface opens (currently: Onboard), it MUST hard-reset lower surfaces:
- `openOnboard()` calls `clearFocus()` + `clearBacklog()` before mounting
- `closeOnboard()` calls `clearFocus()` + `clearBacklog()` before resetting onboard state

Each store with state that could outlive a transition exposes a non-fetching `clear*()` export distinct from its user-facing `close()` (which may trigger cross-store sync via fetchBoard). The clear variant is for lifecycle orchestration; the close variant is for user-initiated dismissal.

If a 4th surface lands (e.g. Phase 7 PWA install dialog) with top-precedence, the openOnboard / closeOnboard pattern is the template. At 5+ surfaces, consider a surface-registry refactor.

## Things Previous Reviews Have Caught

Pre-Dev-Loop history (worth remembering even though not formally captured by the auto-learning convention):

- **2026-04-21:** macOS case-insensitive vs git case-sensitive paths — `git add v2/src/App.jsx` was no-op because git index has lowercase `v2/src/app.jsx`. Caught when 5a-2 followup needed. Pattern: always lowercase paths in `git add`.
- **2026-05-12 (5a-7 codex):** `urgent_count` would go stale after optimistic mutations in `completeTask` and `toggleTaskUrgent`. Fix: track urgent_count delta in mutators. Caught by Codex review.
- **2026-05-12 (5a-7 codex):** Drag-reorder vs concurrent fetchBoard race. Drag controller stores fromIdx/toIdx; if fetchBoard changes top[] mid-drag, reorder applies stale indices to fresh data. Logged in BACKLOG.md (deferred — defensive bounds check landed; full fix when surfaced).
- **2026-05-12 (5a-10 phone test):** Focus blank-screen on iPhone. Three followup attempts before `position:fixed` overlay fix landed. Stacking-context interaction with `#app/bg-gradient/grid-overlay/TopBar backdrop-filter` couldn't be debugged in iPhone-only environment. Pattern: overlay surfaces need fixed positioning, not min-height stacking.
- **2026-05-12 (5a-10 phone test):** iOS Safari longpress fires native context menu concurrently. Fix: `user-select: none; -webkit-touch-callout: none` on gesture targets. Pattern: any long-press target needs both properties.
- **2026-05-14 (5b-2 codex):** Mock backend echoed raw `body.text` for `op:update_task_text` without applying real backend's `trim().slice(0,200)` normalization. Tests would pass against behavior real backend won't deliver. Fix applied. Pattern: mock branches must mirror real-handler normalization.

(Auto-learning entries from Dev Loop Phase 5 will append below this line going forward.)

- 2026-05-15: optimistic-mutator generation guard pattern — needed for any nanostore that fans out to multiple components AND has async mutators that can outlive the modal/surface lifecycle. Caught by Codex adversarial review (5b-3 Phase 3).
- 2026-05-15: success-path cross-store sync should NOT inherit modal-lifecycle generation guards — backend committed regardless of modal state, so other stores need to learn. Caught by Codex adversarial review (5b-3 Phase 3).
- 2026-05-15: optimistic reorder MUST mirror backend priority-rewriting, otherwise subsequent local sorts re-shuffle dragged tasks back. Caught by Codex standard review (5b-3 Phase 2).
- 2026-05-15: drag-layer contract should be documented in the receiving store, not just the drag.js implementation — prevents downstream sub-steps from constructing malformed payloads. Caught by Concurrency Engineer (5b-3 council).
- 2026-05-15: closed-modal silent failure of destructive ops needs UI-level surface in the implementing component, not just store-level error setting — a 30x/day tool loses trust after 2-3 silent failures. Caught by Daily-driver-tool product specialist (5b-3 council).
- 2026-05-15: top-precedence surface (Onboard) must hard-reset lower surfaces (Focus, BacklogDetail) on both open AND close — left-armed state from a previous session can pop up unexpectedly when the top surface dismisses. Caught by Codex adversarial review (5b-4 Phase 3).
- 2026-05-15: dev-override URL params (?force-onboard, ?force-backlog) need explicit cross-flag guards — independent useEffects can race and create hidden-modal-behind-other-modal state. Caught by Codex adversarial review (5b-4 Phase 3).
- 2026-05-15: a non-fetching `clear*()` variant of a store's `close()` is the right primitive when another store's lifecycle needs to orchestrate clearance without triggering side effects. Pattern: `close()` for user-initiated dismissal (may fetchBoard); `clearBacklog()` for lifecycle-orchestrated dismissal (no side effects). Caught by State Lifecycle Architect (5b-4 council).
- 2026-05-15: modal pattern is reusable as CSS/component primitive, but a11y deferrals (focus management, Escape, inert background, aria-live) are explicitly NOT part of the reusable pattern — each new modal surface must re-decide. Caught by Accessibility Engineer (5b-4 council).

---

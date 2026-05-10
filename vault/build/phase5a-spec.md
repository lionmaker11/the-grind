# Phase 5a — Board interactions spec

## What this phase ships

Phase 5a finishes the Board so a user can act on tasks (check off, reorder, launch into Focus) instead of viewing them as a read-only display. Closes the gap between R5b's onboarding-can-write and a usable end-to-end V2.

The Board surface today is Phase 2 read-only (April 21, 2026), with stale P1/P2 priority badges and inert buttons. Phase 5a rebuilds TaskRow per the mockup-set updates from the April 22 simplification pass and wires the four task interactions: check-off, reorder, urgent toggle, launch-to-Focus.

5a-1 (this doc) pins the semantic decisions. 5a-2 onward is implementation against the pinned decisions.

## Design decisions (already locked)

- **Top-3 model = (A):** single backlog per project, urgent-flagged tasks sort to top, Board renders the first 3 of that result. No separate "urgent list."
- **Open #20 (Board onboarding launcher) = closed as no-fix:** the existing `+ NEW PROJECT → museOpen({prefill:'new project: '})` path in Board.jsx:67-72 matches mockup `02-board-empty.html` ("Tell Muse what's next"). Voice filing is the design intent post-onboarding; #20 was a misread of the spec assuming a missing affordance. App.jsx:12 stale comment about Board wiring openOnboard gets corrected in 5a-2.
- **Spec doc style:** lightweight, advisor-drafted. No council convene for 5a.

## What's already wired (don't re-spec)

- `api/backlog.js op:complete` — status flip + completed-date stamp + recurring-daily handling. **No backend work needed for check-off.**
- `api/backlog.js op:reorder` — accepts `{op, project_id, order: [taskId, ...]}` with the full new task ordering. After reorder, re-runs `assignBucketedPriorities()` which assigns vestigial 1-5 priority buckets from list position (legacy field, harmless under the simplification model). **No backend work needed for reorder.**
- `api/backlog.js op:toggle_urgent` — frontend sends desired state explicitly. **No backend work needed for long-press urgent.**
- `lib/drag.js` and `lib/longpress.js` — both self-document cross-surface use. Composable on the same element. **No utility changes needed for the gestures themselves.**
- `lib/api.js backlogOp(payload)` — generic wrapper. **No new api.js exports needed; mutators call `backlogOp({op,...})` directly.**

## Decisions to pin in this doc

### 1. Check-off semantics

**Question:** when the user taps ✓ on a task, what happens to the task in vault?

**Decision: (b) — `status:'done'` flip, kept in vault.**

Already implemented backend-side. Tap `✓` → `backlogOp({op:'complete', project_id, task_id})` → backend sets `status:'done'` and stamps `completed:today()`. Recurring-daily tasks stay `status:'pending'` and the backend stamps `last_completed` instead — frontend renders these the same way (still on Board). Board's existing GET filter (`tasks.filter(t => t.status !== 'done')`) already excludes done tasks from the Board top-3.

Rationale: preserves history for retrospect and for Sunday-review use cases. Doesn't bloat active rendering. Backend was already built this way.

**Known gap (deferred to Phase 5b):** recurring-daily tasks tapped ✓ stay `status:'pending'` (backend stamps `last_completed`) and continue rendering on Board. There's no visual feedback that "today's instance was completed." This is most relevant in Backlog detail's Sunday-review use case (Phase 5b), not Board top-3. Phase 5b owns the visual treatment for completed-today-but-still-pending recurring tasks.

### 2. Reorder mechanism

**Question:** when the user drags a task to a new position, what backend op fires? What payload shape?

**Decision:** `backlogOp({op:'reorder', project_id, order: [taskId, taskId, ...]})` with the full new ordering of pending tasks within that project.

The frontend computes the new full order locally (drag.js gives us `from` and `to` indices; we splice the array of pending task IDs in the boardStore summary) and sends the entire array. Backend re-runs bucketed-priority assignment as a side effect — irrelevant under the simplification model but harmless.

Rationale: matches the existing op contract exactly. No backend change. `order` array is small (top-3 is what the Board has loaded; full reorder requires Backlog detail in Phase 5b).

**Top-3 reorder approach: send top-3 IDs only; backend's reorder loop appends the rest preserving original relative order (api/backlog.js:376-378).** Within-top-3 reorder is the visible use case for Board; cross-top-3 reorder (drag from rank 1 to rank 5) requires Backlog detail visibility and lands in Phase 5b.

### 3. Top-3 sort: urgent first

**Question:** the GET `/api/backlog` summary returns `top: pending.slice(0, 3)` after `sortByPriority()`. The simplification pass says urgent floats to top. Where does urgent-first sorting happen?

**Decision:** backend. Update `sortByPriority` (or add a new `sortForBoard` selector) so urgent-true entries sort ahead of urgent-false entries. Within each group, preserve current priority/order. This is the smallest change that makes Decision 1 (Top-3 model A) actually true.

Also: extend `top` array entries to include `urgent` field so Board can render the amber rail. Currently they're `{id, text, priority}` (line 152). Add `urgent`.

Rationale: keeps sort logic in one place. Frontend just renders what backend returns, no client-side resorting. **This is the only real backend change in 5a — counts as 1 of the Pattern-1 budget exceptions per phase, not 2.**

### 4. EXECUTE button target

**Question:** what does the persistent blue EXECUTE button at the Board bottom do?

**Decision:** launches the top-most pending task across all projects into Focus. "Top-most" = the first task in the first project after Decision 3's sort.

If Board is empty (no pending tasks across any project), EXECUTE is not rendered. The empty-state layout (mockup `02-board-empty.html`) replaces the full Board view including the EXECUTE button — this is consistent with that mockup. Avoids a disabled-button edge case in Playwright tests.

Rationale: matches "what's at the top is what's next" mental model from Decision 1. Single-tap shortcut to "start the most urgent thing." Same destination as tapping ▶ on the literal top row.

### 5. Launch-to-Focus stub

**Question:** the per-row ▶ button and the EXECUTE button both route to Focus. Focus is Phase 6. What does 5a do?

**Decision:** 5a stubs Focus with a minimal placeholder component. The wiring is real — Board ▶ navigates to it, EXECUTE launches into it, route handles task_id param — but the destination renders a "Focus surface coming in Phase 6 — task: {text}" screen with a back button. No timer, no pomodoro logic, no Ring SVG.

**Routing approach:** since V2 has no router today (single-page Board+Onboard mounted by `App.jsx`), 5a uses a simple state-store-driven view switch. New `focusStore` with `{activeTaskId, activeTaskText}`. App.jsx renders `<Focus />` instead of `<Board />` when `focusStore.activeTaskId` is set.  No URL routing in 5a. Phase 6 may add routing if Focus needs deep-linkability.

Rationale: ships interaction completeness for 5a without doing Phase 6 work early. Avoids introducing a router we don't otherwise need.

### 6. Ghost-row wiring

**Question:** what is "ghost-row" and what triggers it?

**Decision:** during drag, render a "← DROP ZONE" indicator above the row position the dragged item would land in if released now. Visual affordance only. Matches frame B of `33-reorder-animation.html` ("ROW LIFTED · OTHERS REFLOW" + drop-zone marker).

Implementation reuses `lib/drag.js` infrastructure. Add an indicator element to TaskRow that's normally `display:none` and toggled visible during drag based on the controller's pointer-position state. **Implementation approach: CSS-only first, using `:has()` + the existing `.dragging` class to render the drop indicator on the hovered sibling. iOS Safari 16+ has good `:has()` support; T.J. is on iOS 17+. If CSS-only fails to render the indicator at the right position for some edge case, fall back to a small drag.js extension that exposes hovered-slot index via the controller. Default is CSS-only.**

Rationale: small UX polish, makes drag feel deterministic. Mockup explicitly shows it.

### 7. Long-press for urgent on Board

**Question:** should Board task rows support long-press to toggle urgent (matching OnboardReview behavior)?

**Decision:** yes. ~500ms hold on `.task-text` toggles urgent. Reuses `lib/longpress.js`. Calls `backlogOp({op:'toggle_urgent', project_id, task_id, urgent: <new state>})`. Visual feedback during hold via `.longpress-active` class (already documented in longpress.js header). Toggled state visible via amber left-rail accent on the row.

Rationale: gesture consistency with OnboardReview. Established. Matches mockup 33 frame D ("✓ NEW URGENT — ROW NOW PULSES AMBER").

## Backend changes scope

**One change only** (Pattern-1 exception, 1 of 1-2 phase budget):

- `api/backlog.js` GET handler: extend `top` array entries to include `urgent` field. Update `sortByPriority` (or add `sortForBoard`) so `urgent:true` entries sort ahead of `urgent:false` within the pending list. Top-3 selection unchanged (`slice(0, 3)` after sort).

No new ops. No new schema fields. No vault file migrations. The complete + reorder + toggle_urgent ops are all already wired.

## State changes (`v2/src/state/board.js`)

Add three mutator actions:

- `completeTask(projectId, taskId)` — calls `backlogOp({op:'complete', project_id, task_id})`. Optimistic update: remove task from `summary[].top` and decrement `summary[].task_count`. On error, restore from snapshot + surface error via boardStore.error.
- `reorderTopThree(projectId, newOrderIds)` — calls `backlogOp({op:'reorder', project_id, order: newOrderIds})`. Optimistic update: replace `summary[].top` with the new ordering. On error, restore.
- `toggleTaskUrgent(projectId, taskId, urgent)` — calls `backlogOp({op:'toggle_urgent', project_id, task_id, urgent})`. Optimistic flip on the matching `summary[].top[].urgent`. On error, restore.

Plus a non-mutating helper:

- `launchTask(projectId, taskId)` — sets `focusStore.activeTaskId` and `.activeTaskText`. No backend call.

**Re-fetch policy:** mutator success path trusts the optimistic update; no automatic re-fetch after success. Re-fetch fires only on error (to recover correct state from server). Re-fetching after every successful op floods the backend and adds user-perceived latency for no benefit. The existing post-Muse-action re-fetch in Board.jsx (lines 21-26) covers the cross-surface sync case.

Preserve existing read shape — `summary[]` keeps the same field names so all 5 existing consumers (App.jsx, Board.jsx, TopBar.jsx, OrphanPicker.jsx, OnboardReview.jsx) keep working without changes. The only addition is `urgent` on each `top[]` entry.

## Component scope

- `TaskRow.jsx` — full rebuild. Drag handle (`<span class="drag-handle">`), task text (with `wrap2` two-line treatment from mockup 35), ▶ launch button, ✓ check button, urgent class on row root. Reuses `lib/drag.js` and `lib/longpress.js` per their header CSS contracts. P-badge removed entirely.
- `ProjectCard.jsx` — minor updates. Header format becomes "N URGENT / TOTAL" per mockup 01 (currently shows "Nd · N PENDING"). Pass urgent count down from `summary[].top` data.
- `Board.jsx` — wire EXECUTE button onClick → `launchTask` of top-most task. **EXECUTE not rendered when no pending tasks** (per Decision 4). Drag-row indices threaded through ProjectCard → TaskRow → reorderTopThree.
- `Focus/Focus.jsx` — new minimal component. Reads `focusStore`, renders task text + back button. Back button clears `focusStore.activeTaskId` → App.jsx re-renders Board.
- `state/focus.js` — new minimal store: `{activeTaskId, activeTaskText}`, plus `setActive(id, text)` and `clear()`.
- `app.jsx` — switch render: if `focusStore.activeTaskId` is set, render `<Focus />` instead of `<Board />`. Update line 12 stale comment about Board wiring openOnboard (open #20 is no-fix).

## What's out of scope

- **Phase 5b** (Backlog detail modal, full task list per project, pomodoro glyphs, aggregate counts, drag-to-reorder beyond top-3)
- **Phase 6** Focus surface real implementation (Ring SVG, timer, pomodoro state machine, Muse integration during focus)
- **Phase 7** routing / deep-linking
- Muse undo toast (`+ FILED TO PALLISTER [UNDO]` from mockup 04 — Muse-side change, separate owner)
- `op:set_priority` vestigial cleanup (legacy 1-5 priority field has zero UX surface now; remove later)
- Removing the bucketed-priority side-effect from `op:reorder` (also vestigial, harmless)
- Anything not explicitly listed in the Component scope above

## Test plan

New Playwright spec at `v2/tests/board-flow.spec.js` against the existing mock-backend infrastructure:

1. **Render with POPULATED_REGISTRY** — Board shows N projects, top-3 per project, urgent rows above non-urgent in each project's top-3.
2. **Tap ✓ on a pending task** — task disappears from Board, `op:complete` POST captured with correct `(project_id, task_id)`.
3. **Drag-reorder a task within a project's top-3** — `op:reorder` POST captured with the new order array; subsequent re-render reflects the new order.
4. **Long-press on `.task-text`** — `.longpress-active` class appears during hold, urgent class toggles on row, `op:toggle_urgent` POST captured with `urgent: true`.
5. **Tap ▶ on a task row** — `<Focus />` mounts, renders the tapped task's text. Back button returns to Board.
6. **Tap EXECUTE** — `<Focus />` mounts with the top-most task across all projects (i.e., first-project's-first-row).
7. **Empty Board** — EmptyState renders, EXECUTE button is not in the DOM, no Focus launch possible.

Reuse `setupMockBackend` from R5b helpers — extend with handlers for `op:complete`, `op:reorder`, `op:toggle_urgent` capture. Mock backend currently captures `chief`, `transcribe`, `projects`, `backlog` arrays; will extend `backlog` capture or add a `boardOps` array for clarity.

## Phase 5a sub-step plan (reference, not committed scope)

- **5a-1** — this spec doc
- **5a-2** — fix `App.jsx:12` stale comment, formally close open #20 in phase4-open-items.md
- **5a-3** — backend tweak: extend GET top entries with `urgent`, update `sortByPriority` for urgent-first
- **5a-4** — boardStore mutators (`completeTask`, `reorderTopThree`, `toggleTaskUrgent`, `launchTask`)
- **5a-5** — `state/focus.js` + `Focus/Focus.jsx` stub
- **5a-6** — TaskRow rebuild (drag, longpress, urgent visual, launch + check buttons)
- **5a-7** — ProjectCard header rewrite (urgent count) + Board.jsx EXECUTE wiring
- **5a-8** — Ghost-row drop indicator (CSS-only `:has()` default; drag.js extension fallback)
- **5a-9** — Playwright board-flow.spec.js
- **5a-10** — pre-merge status report (`vault/build/phase5a-status.md`, mirrors phase4-r5b-status.md format)
- **5a-11** — phone test (T.J.)
- **5a-12** — merge `v2-phase4` to `main` (R5b + 5a together; refresh PHASES.md, archive phase4 docs)

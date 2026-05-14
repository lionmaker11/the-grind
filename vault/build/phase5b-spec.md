# Phase 5b — Backlog Detail Modal (spec)

**Date:** 2026-05-14
**Status:** Spec finalized; sub-step implementation begins next
**Predecessor:** Phase 4 R5b + Phase 5a shipped to main (d3b3de4)

## What ships in Phase 5b

A backlog detail modal launched from project cards on Board. Shows the full task list per project (not just top-3) with drag-to-reorder as primary priority mechanism, URGENT/NORMAL grouping, inline text editing, check-off, and delete. Pattern matches Phase 5a Focus stub for overlay mounting (position:fixed; z-index: 50; padding-top: top-bar height).

## What is NOT in Phase 5b (deprecation from mockups)

Mockup 23 originally specified per-task pomodoro estimates with a 4-dot inline rail per row plus an aggregate "Σ N tomatoes queued" header panel. **This is deprecated.** Council 3 deliberation surfaced that pomo estimates are better modeled as session state (asked at launch on Focus), not planning state (stored per-task). Pomo design relocates entirely to Phase 6 (Focus surface).

Specifically removed from Phase 5b scope:
- Pomo estimate as task data field
- Inline pomo dots on backlog detail rows (Mockup 24 glyph control)
- Aggregate header panel showing tomatoes / hours / sessions
- Backend op for estimate updates
- "Near-done" row state (was unspecified in mockup; defer to design clarification if ever needed)

Mockup 23's row layout simplifies to: drag-handle + task text + check + delete. Mockup 23's pomo rail and aggregate header panel are deprecated; Phase 6 will re-specify pomo interactions on Focus.

## Decisions locked

### Decision 1 — Modal mount strategy

Mount via new backlogStore.openProjectId. Exit via close action (close button top-right per mockup 23). App.jsx render switch adds backlog modal as a third state alongside Onboard and Focus. Onboard precedence wins over modal (Onboard is full-screen takeover); modal precedence wins over Board (modal is also full-screen). Focus and modal are mutually exclusive (only one launches at a time from Board).

### Decision 2 — Modal overlay pattern

position:fixed; top:0; left:0; right:0; bottom:0; z-index: 50; height: 100vh + 100dvh fallback; padding-top: calc(var(--top-bar-h) + var(--s-4)); explicit background: var(--bg). Pattern locked in by Phase 5a-10 followup 3 (Focus blank-screen fix on iOS Safari). Do NOT use min-height: 100% — that requires explicit parent height that #app does not consistently provide.

### Decision 3 — Project-card affordance for opening modal

Add a visible chevron at the right edge of each project-card header (after the urgent-count display). Chevron is the explicit tap target for opening the modal. Card body remains non-tappable to preserve Phase 5a's affordance model (Board's read-only-display behavior on the card body is unchanged). Krug's council position: visible affordance over invisible tap target.

### Decision 4 — Per-row gesture set (simplified after pomo relocation)

Four interaction targets per row:
- Drag-handle — vertical reorder via drag.js
- Task text — tap to enter edit mode (inline contentEditable or input); long-press 500ms to toggle urgent (longpress.js, reuses Phase 5a pattern)
- Check button — completes task (op:complete, existing backend)
- Delete button — removes task (op:delete_task, new backend op)

No swipe gestures. Council deliberation surfaced that swipe-on-modal on iOS Safari adds gesture-disambiguation complexity that fights existing drag + long-press + tap gestures. Buttons are explicit; ship and judge after dogfood.

### Decision 5 — Backend additions (Pattern-1 budget)

Two new ops in api/backlog.js:
- op:update_task_text — { op:'update_task_text', project_id, task_id, text } — replaces task.text field, no other side effects
- op:delete_task — { op:'delete_task', project_id, task_id } — removes task from project's task list permanently

Total Pattern-1 budget for Phase 5b: 1-2 slots (likely 1 if shipped as a single backend commit). Both ops follow existing op-routing pattern; Codex review required per CLAUDE.md /api/* strict-mode carve-out.

### Decision 6 — backlogStore shape

New nanostore separate from boardStore (which is summary-shaped, top-3 only). backlogStore is full-list per project:

Fields:
- openProjectId — null when modal closed
- tasks — full task list for open project, in order
- projectName
- taskCount
- urgentCount
- loading
- error

Mutators (optimistic-update + rollback per Phase 5a-4 convention):
- openProject(projectId) — fetches full task list, sets openProjectId
- close() — clears state, closes modal
- reorder(newOrderIds) — drag-reorder commit, op:reorder backend
- toggleUrgent(taskId, urgent) — op:toggle_urgent backend
- completeTask(taskId) — op:complete backend
- editText(taskId, newText) — op:update_task_text backend
- deleteTask(taskId) — op:delete_task backend

### Decision 7 — Edit-text interaction

Tap on task text enters inline edit mode. Implementation TBD between contentEditable on the text element vs replacing with a real input element on tap. Both have iOS Safari quirks (contentEditable triggers selection menus; input triggers keyboard but is more controlled). Reading pass during 5b-6 will pick the cleaner pattern; default lean is input element with autoFocus for explicit keyboard control.

Commit on blur OR Enter; cancel on Esc; auto-cancel if text is empty after trim.

### Decision 8 — URGENT / NORMAL section grouping

Section labels render in modal list body per mockup 23. URGENT group first, NORMAL group below. Group labels render unconditionally (Liukas position from council: long backlogs benefit from group structure). May add conditional rendering threshold in polish (only show labels when both groups have 2+ items) if dogfooding reveals it as noise.

### Decision 9 — Modal pre-empts only Board, not Onboard or Focus

If Onboard is active, modal cannot open (Onboard precedence per Phase 5a Decision 5). If Focus is active, modal cannot open (only one detail surface at a time; user must return to Board via back link then tap chevron). Modal closes if user navigates away via close button.

### Decision 10 — Ghost-row + longpress-ring (modal-only for now)

Mockup 33's drag/longpress storyboards (ghost-slot at drag origin, amber longpress-ring 1.2s fill) apply to both Board and modal, but Phase 5b ships them on modal only. Board parity for these polish items deferred to motion-polish final sweep (PHASES.md Future considerations). Reasoning: cleaner 5b scope; both features land at once during final sweep with motion across all surfaces.

## Mockup deprecations summary

Mockup 23 (backlog detail): row layout simplified (no pomo rail); aggregate header panel removed (no per-task estimates).
Mockup 24 (glyph study): relocated to Phase 6 / Focus surface scope.
Mockup 33: implemented for modal only in Phase 5b; Board parity deferred to motion-polish sweep.

## Sub-step plan

10 sub-steps. Mirrors R5b / Phase 5a cadence.

- 5b-1 — Spec doc (this commit)
- 5b-2 — Backend ops: op:update_task_text + op:delete_task in api/backlog.js (Pattern-1 slot, Codex review required)
- 5b-3 — backlogStore + mutators (new nanostore, optimistic-update + rollback)
- 5b-4 — BacklogDetail.jsx + .css (modal frame, header, mount via App.jsx render switch)
- 5b-5 — TaskRow inside BacklogDetail (drag + text + check + delete; reuses lib/drag.js + lib/longpress.js)
- 5b-6 — Edit-text inline interaction (tap-to-edit on task text, contentEditable vs input decision)
- 5b-7 — Board project-card chevron affordance (small Board.jsx + ProjectCard.jsx + ProjectCard.css additions)
- 5b-8 — Playwright tests covering modal mount, drag-reorder, edit-text, check-off, delete, urgent toggle, group rendering
- 5b-9 — Pre-merge status report (vault/build/phase5b-status.md)
- 5b-10 — Phone test + merge to main

## Test plan (to be expanded during 5b-8 reading pass)

7-9 tests minimum:
1. Tap chevron → modal opens with correct project's task list
2. Drag-reorder within URGENT or NORMAL group — POST captured, DOM reflects order
3. Long-press text → urgent toggles, task moves between URGENT/NORMAL sections, header count updates
4. Tap text → enters edit mode; commit text edit via Enter, POST captured, DOM reflects edit
5. Tap check on a task → removes from list, header count decrements
6. Tap delete on a task → removes from list permanently, header count decrements
7. Close modal → returns to Board, store cleared
8. Open modal with empty project (no tasks) → empty-state rendering verified
9. Optional: Esc-to-cancel during edit mode

## Open questions deferred to implementation

- contentEditable vs input element for edit mode (decided in 5b-6 reading)
- Exact CSS for ghost-slot / longpress-ring on modal (5b-5 implementation; reads mockup 33 specs)
- Conditional rendering threshold for URGENT/NORMAL labels (default: always show; revisit in dogfood)
- Whether to add delete confirmation affordance for delete button (default: no, optimistic delete + rollback handles accidents; revisit if dogfooding reveals frequent misclicks)

## Pattern inheritance from Phase 5a

- Optimistic-update + rollback convention in mutators (from boardStore 5a-4)
- iOS Safari overlay pattern (from Focus 5a-10 followup 3)
- Drag composition with longpress on different elements (from TaskRow 5a-6)
- Testid convention: backlog-task-{id}, backlog-task-drag-{id}, backlog-task-text-{id}, backlog-task-check-{id}, backlog-task-delete-{id}, backlog-modal-root, backlog-modal-close
- Codex review on /api/* edits

## Pattern-1 budget tracking

Phase 5b allocated 1-2 slots. Likely usage:
- 5b-2: op:update_task_text + op:delete_task (single commit, 1 slot)
- Reserved: 1 slot for any unforeseen needs surfaced during implementation

If only 1 slot used, second carries forward to motion-polish sweep or Phase 6 as needed.

# BACKLOG

Operational backlog for items committed to ship but not yet placed in a specific phase. Read by Dev Loop Protocol's Session Start (Step 4). The user can ask to tackle items at any time. New items captured per Dev Loop's Backlog Capture rule (Phase X scope-creep deferrals land here).

## Migrated from PHASES.md "Future considerations" (2026-05-15)

- [ ] **Motion polish — final sweep before V2 ship** — V2 currently has binary state transitions throughout (instant mount/unmount, immediate appear/disappear, snap reorders). The app feels rigid. A dedicated motion-polish pass smooths every surface as the final step before V2 is considered shipped.

  Not gamification, not dopamine architecture, just craft. Target: the app flows between states rather than snapping.

  Scope (non-exhaustive — to be expanded as surfaces are built):
  - Row fade-out on ✓ tap (~200ms ease-out)
  - Board ↔ Focus transition (currently jarring mount/unmount)
  - Sibling-row settle animation after drag-release
  - Header count number tweens (urgent/total animate up/down rather than swap)
  - Project card expand/collapse if Phase 5b adds Backlog detail
  - Onboard step transitions (currently snap between drive-states)
  - Focus surface state transitions once Phase 6 builds the real one
  - Any other surface added in Phase 6, 7, 8 — all in scope for the final sweep

  Timing: AFTER all functional V2 phases ship. Doing it earlier means re-doing it each time a new surface lands. Doing it last means one comprehensive sweep with the full app in front of us.

  Implementation: CSS transitions + transform animations primarily. Possible useTransition/AnimatePresence-equivalent for Preact if needed for mount/unmount transitions. Low JS-state-machine change.

  Status: **committed deliverable for V2 ship** — if V2 ships without this pass, V2 isn't fully shipped.

- [ ] **Latent parallel-write race in api/backlog.js** — All 8 mutating ops (add, remove, set_priority, toggle_urgent, complete, reorder, update_task_text, delete_task) share `Promise.all([writeBacklog, touchRegistry])` pattern. Same shape that caused the 899c02d parallel-write race in api/project.js — two GitHub Contents API writes against the same branch ref, independent tree computations, GitHub silently dropping one under load.

  Fix when surfaced: serialize — backlog first, registry touch second, registry only if backlog landed. Mirror the api/project.js fix pattern. **When fixed, address all 8 op handlers in one commit for consistency** — partial fix obscures the systemic issue.

  Originally documented: archived `vault/build/archive/phase4-open-items.md` item #8 (filed Phase 4 R5b).

  Status: latent (no observable bug yet — likely because writes are less frequent than onboarding's project-creation burst); revisit if any write loss surfaces in dogfood.

- [ ] **Drag-reorder race with concurrent fetchBoard** — Codex flagged during 5a-7 review. Drag controller stores `fromIdx`/`toIdx` from pointer-down through pointer-release; if `fetchBoard` or another mutator changes `top[]` mid-drag, the reorder applies stale indices to fresh data and could move the wrong task.

  Defensive bounds check in ProjectCard catches the list-shrunk case (partial mitigation). Full fix requires `drag.js` extension (onDragStart callback) which would ripple to OnboardReview — out of scope for 5a-7.

  Status: ship-and-revisit — address if wrong-task-reordered behavior surfaces in real use during dogfood. Otherwise revisit Phase 6+ if needed.

## 2026-05-15 — captured during 5b-3 (backlogStore)

- [ ] **Concurrent same-modal mutator rollback can resurrect/undo later mutations** — Codex flagged during 5b-3 Phase 2 review. backlogStore mutators snapshot the whole `tasks` array at start; on failure, they restore the snapshot. If two mutators run concurrently (e.g. `completeTask(A)` removes A and succeeds, then a previously-started `toggleUrgent(A)` fails and restores the older snapshot containing A), the failed rollback resurrects A. Same shape: `editText(A)` followed by `deleteTask(A)` — edit failure can resurrect the deleted task.

  Generation guard added in 5b-3 covers modal-close + project-switch races; this remaining race is concurrent same-modal mutators on overlapping rows. Single-user single-tenant scope makes it low-frequency in practice.

  Fix when surfaced: per-row mutation lock (UI disables actions while in flight) OR patch-based rollback (each mutator records its specific change and reverses just that change on failure, instead of whole-array snapshot restore). Latter is cleaner but ~80 lines of additional defensive code per mutator.

  Status: defer — revisit if observed in dogfood (look for "task that I deleted reappeared" or "edit that I made reverted" reports).

- [ ] **boardStore.fetchBoard out-of-order response race** — Codex 5b-3 Phase 3 flagged. Multiple rapid modal mutations each fire `fetchBoard()`; if response #4 arrives after response #10, the older summary overwrites the newer. Visual result: Board momentarily reverts to an older state. Fix needs request-generation guard inside `fetchBoard()` itself (boardStore module change, not backlogStore).

  Status: defer — backlogStore now sends fetchBoard pings; the race is in fetchBoard's lack of guard. Fix when this surfaces or as part of broader fetch-orchestration cleanup.

- [ ] **fetchBoard sets `loading: true` causing flicker on modal-action sync** — Codex 5b-3 Phase 3 flagged. Each modal save triggers fetchBoard which sets `loading: true`; Board may render skeleton/spinner behind/after the modal. Fix: add `silent: true` option to fetchBoard that skips loading flag for background sync calls. Module change in board.js.

  Status: defer — UX concern only. Verify in dogfood if Board behind modal has visible loading state.

- [ ] **GitHub API request pressure under modal-action spam** — Codex 5b-3 Phase 3 flagged. Each successful modal mutation calls fetchBoard which triggers ~N+1 GitHub Contents API calls (registry + per-project backlog). 10 modal actions × 20 active projects = ~200 reads. No rate-limit hit yet, but worth coalescing. Fix: debounce fetchBoard to fire at most once per N seconds, OR batch-fire after a quiet period.

  Status: defer — single-user dogfood is unlikely to spam at this scale; revisit if rate limits trigger or if Vercel cold-start latency becomes noticeable.

- [ ] **External-mutation invalidation while modal open** — Codex 5b-3 Phase 3 flagged. If Muse files a new task to the project while modal is open, modal's tasks array is stale until close+reopen. Modal mutators and Muse ops can also overwrite each other at the backend (sha-based optimistic concurrency catches conflicts but frontend doesn't refetch on success to discover them).

  Fix: subscribe modal to a server-sent event or poll periodically while open. Simpler: add a "refresh" affordance in the modal header. Simplest: accept the race — modal sessions are short, Muse-while-modal-open is rare.

  Status: defer to dogfood signal. Likely never happens in solo-operator use.

- [ ] **Closed-modal mutation failure swallowed (no user feedback)** — Codex 5b-3 Phase 3 flagged. User taps delete then closes immediately; backend returns 500. Generation guard suppresses the error write. User has no signal that delete failed. Board's fetchBoard fires unconditionally on success but NOT on failure — so the failed mutation's underlying state never surfaces.

  Fix options: (a) write closed-modal failures to boardStore.error (TopBar shows offline indicator); (b) toast notification surface; (c) accept and log via dogfood.

  Status: defer — accept the swallow for now. Watch dogfood for "I deleted that task but it's still there with no error" reports.

- [ ] **Extract assignBucketedPriorities + sortByPriority to lib/sort.js** — Council 4 (5b-3) flagged: same logic now triplicated in `api/_lib/vault.js`, `v2/src/state/board.js`, `v2/src/state/backlog.js`. YAGNI threshold passed at 3. Extract to a shared util when a fourth caller appears (likely Phase 6 Focus surface).

  Status: defer until fourth caller. Note: extraction may want to live in a shared `lib/` accessible to both /api/* (Node) and /v2/src/* (browser bundle), which means picking a path that works for both runtime targets. Currently no shared lib exists — `api/_lib/` is /api/* private, `v2/src/lib/` is bundle private.

## 2026-05-15 — captured during 5b-4 (BacklogDetail modal frame)

- [ ] **Keyboard + screen-reader accessibility for BacklogDetail modal** — Codex 5b-4 Phase 3 flagged 4 related a11y gaps in the modal frame: (1) no focus management on mount or close (focus stays on Board control that opened it); (2) no Escape key handler to dismiss; (3) background (Board + Muse) not marked `inert` while modal open, so screen reader can navigate beyond the dialog; (4) urgent/task counts in header are not aria-live, so SR users don't hear updates when fetch resolves or mutations land.

  All four are standard dialog-pattern requirements per WCAG 2.1. Voice-first principle and iPhone-only deployment make these lower priority than usual (T.J. is the user; touch is primary), but if any of these surface as friction during dogfood or if accessibility audit becomes a phase gate, fix all four together.

  Status: defer — single solo-operator user, touch-primary device. Revisit if anyone with assistive tech ever uses the app or if accessibility becomes a phase gate.

- [ ] **One-frame Board flash when `?force-backlog` URL override is used** — Codex 5b-4 Phase 3 flagged. The dev override runs in `useEffect` which fires AFTER initial render, so the first paint shows Board, then openProject() flips to modal. On slow JS / first paint this is visible.

  Fix: initialize backlogStore.openProjectId synchronously from URL before App component renders (e.g. in main.jsx or as a default-state hook). Cost: small refactor; benefit: cosmetic only.

  Status: defer — affects dev override only; the production trigger (5b-7 chevron) is user-initiated tap so no flash. If `?force-backlog` becomes a permanent deep-link affordance, revisit.

- [ ] **Duplicate fetchBoard on modal close** — Codex 5b-4 Phase 3 flagged. close() calls fetchBoard(); then Board remounts and its own useEffect also calls fetchBoard(). Two identical /api/backlog summary requests race on slow connections.

  Fix: either drop fetchBoard from close() (Board's mount-time fetch handles it), OR drop Board's mount fetch (rely on backlogStore.close having done it). Former is safer (existing Board mount path is the canonical refresh).

  Status: defer — race noise only, both requests return the same data. Revisit if rate-limit pressure surfaces or if observable loading flicker behind modal.

- [ ] **Stale Board data window between modal close and fetchBoard resolution** — Codex 5b-4 Phase 3 flagged. close() flips openProjectId to null synchronously; Board mounts with whatever boardStore.summary had before modal opened. fetchBoard's response arrives ~200-500ms later and updates Board.

  Window is normally invisible (modal mutations already called fetchBoard during the session). Surfaces when user opens modal, makes no edits, external vault state changes, then closes. Single-user solo-operator scope makes this near-zero frequency.

  Status: defer — accept the stale window. Revisit if dogfood reports "I closed the modal and the board didn't update."

- [ ] **Stacked-modal accessibility ambiguity (Muse over BacklogDetail)** — Codex 5b-4 Phase 3 flagged. Both `<BacklogDetail role="dialog" aria-modal="true">` and `<MuseSheet role="dialog" aria-modal="true">` can be simultaneously active. Visual z-index handles it; accessibility tree does not.

  Related to existing dogfood watch entry ("Muse FAB covers stuff in modal"). If the Muse-FAB-hide decision lands, this stacked-modal issue resolves as a side effect.

  Status: defer — same root cause as the FAB-overlap dogfood entry.

## 2026-05-15 — captured during 5b-5 (TaskRow inside BacklogDetail)

- [ ] **drag.js mixed-height row drop-index inaccuracy** — Codex 5b-5 Phase 2 flagged. `lib/drag.js` measures only the dragged row's height (line 138) and computes `toIdx` via `Math.round(delta / drag.rowHeight)` (line 163), assuming uniform row heights. Backlog detail rows wrap to 2 lines via `.wrap2` class, so a short row dragged through tall rows can skip slots earlier than the visual midpoint suggests.

  Pre-existing drag.js limitation; affects Board too but is more visible in modal where rows tend to be longer text. Fix: extend drag.js to use actual element bounding rects per row instead of the uniform assumption.

  Status: defer — library work, not 5b-5 scope. Verify in 5b-9 phone test on iPhone with mixed-length tasks; if dogfood signals "wrong row moved" reports, prioritize.

- [ ] **longpress.js timer can fire on detached element** — Codex 5b-5 Phase 2 flagged. `lib/longpress.js` has no destroy hook (line 86 acknowledges this); timer set on pointerdown can fire after the row unmounts (e.g. concurrent complete/delete removes the row mid-hold, or modal closes mid-hold).

  Scenario: user holds task text while another action removes the row → spurious `toggleUrgent(missingTaskId)` → backend 404 → store error state. Same class as the deferred concurrent same-modal mutator rollback issue.

  Fix when surfaced: add destroy hook to longpress.js, call from BacklogTaskRow unmount via useEffect cleanup. Or accept and rely on backend 404 + frontend rollback handling.

  Status: defer — low-frequency in single-user single-tenant use. Variant of the existing "Concurrent same-modal mutator rollback" BACKLOG entry.

- [ ] **Modal-only ghost-row drop indicator (mockup 33 spec)** — Spec Decision 10 aspirational: "Mockup 33's drag/longpress storyboards (ghost-slot at drag origin, amber longpress-ring 1.2s fill) apply to both Board and modal, but Phase 5b ships them on modal only."

  Technical reality: `lib/drag.js` does not currently render a placeholder element at the drag origin (it translates the dragged row visually but the original DOM slot still contains the row). Implementing ghost-row requires either:
  - Extending drag.js with optional `renderPlaceholder` callback (ripples to Board's controller; gated by per-call option so Board behavior unchanged unless opted in)
  - Hand-rolling a parallel drag controller for the modal

  Both options exceed 5b-5 scope per Solo-operator velocity. Defer to motion-polish sweep where ghost-row + Board parity land together.

  Status: defer to motion-polish sweep. Existing drag visual (translateY + .dragging class with cyan glow) provides functional drag feedback without the ghost-row.

- [ ] **Modal-only amber longpress-ring (mockup 33 spec)** — Companion to the ghost-row item above. Mockup 33 shows a 36×36 amber ring filling around the long-press target over 1.2s. `lib/longpress.js` currently fires only at 500ms with no visual progress indicator (just adds `.longpress-active` class for outline feedback).

  Implementing requires extending longpress.js with progress callback or hand-rolling the ring in BacklogTaskRow (setInterval/raf updating a CSS conic-gradient or SVG arc).

  Status: defer to motion-polish sweep. Existing `.longpress-active` amber outline provides adequate feedback for functional gesture confirmation.

- [ ] **boardStore.completeTask has the same recurring-task filter bug as backlogStore had** — Codex 5b-5 Phase 3 surfaced the bug in backlogStore (fixed); same pattern exists in `v2/src/state/board.js` completeTask. When user completes a daily recurring task from Board's top-3, the optimistic update removes it from top[]; backend keeps it pending (stamps last_completed only); next fetchBoard re-includes it. User sees it disappear then come back.

  Fix: mirror backlogStore's `isRecurring` check in boardStore.completeTask. Keep recurring tasks in top[] optimistically; don't decrement task_count.

  Status: pre-existing bug, not in 5b-5 scope. Fix in a focused boardStore commit OR fold into motion-polish sweep when recurring-task UX is designed properly.

- [ ] **Recurring task done-today visual indicator in modal + Board** — Frontend fix above keeps recurring tasks visible after completion. But the user has no visual signal that their tap registered. Backend stamps `last_completed = today`; frontend could compare to today's date and render a "✓ DONE TODAY" indicator on the row.

  Requires CSS rule + small markup addition to BacklogTaskRow (and Board TaskRow when that fix lands). Plus a `today()` helper or date-fns dependency.

  Status: defer — UX design needed. Recurring-task workflow hasn't been formally designed in the V2 spec set. Could pair with the boardStore fix above.

- [ ] **Concurrent same-modal mutator rollback — RE-RATED SEVERITY (3x now)** — Originally logged in 5b-3 as low-frequency-in-practice. Codex 5b-5 Phase 3 elevated when rapid check/delete sequences became normal use. Codex 5b-6 Phase 3 elevated AGAIN: 5b-6's edit-text turns this into a TRIVIAL 2-tap workflow — user edits row A, blurs (commits A async), edits row B, blurs (commits B async). Both editText calls capture whole-array snapshots concurrently. If A's commit fails after B's succeeds, A's rollback restores the snapshot from before B's edit, erasing B's successful optimistic text from the modal display.

  5b-6 mitigations applied: disabled check + delete + drag-handle while editing prevents same-row edit→destructive races AND same-row edit→reorder races. Two-row sequential edits remain unguarded — they're the natural flow.

  Single-user single-tenant context still bounds the issue (one finger, one tap at a time), but the window is wider with each new sub-step. By 5b-7 chevron + 5b-8 tests this will be the most-frequently-triggered race in the codebase.

  Status: **prioritize after 5b-9 phone test** — if T.J. reports ANY of "edit reverted", "deleted task came back", "completed task reappeared", implement patch-based rollback (each mutator records its specific change and reverses just that change on failure) as a dedicated commit before merge. Estimate: ~80 lines across 5 mutators.

- [ ] **In-flight drag silently canceled if section membership changes** — Codex 5b-5 Phase 3 flagged. `BacklogList` rebuilds urgent/normal drag controllers when section id lists change. If a separate mutator (long-press toggle on another row, complete/delete on another row) changes section membership mid-drag, the old controller is destroyed and the user's pointer-down is orphaned. Drag doesn't corrupt state — it just dies; user lifts finger and re-drags.

  Fix would require persistent controllers across re-renders OR pausing section rebuilds while drag is active.

  Status: defer — behavioral concern only, not data corruption. Low-frequency in single-user. Revisit if dogfood reports "drag stopped working mid-action."

- [ ] **`.join(',')` useMemo dep collision with comma-in-id schemes** — Codex 5b-5 Phase 3 noted: current ids are `<prefix>-NNN` (no commas) so the stringified dep is safe. If future id scheme allows commas (e.g. user-named ids), `['a,b', 'c']` and `['a', 'b,c']` would both stringify to `a,b,c`, skipping a needed controller rebuild.

  Fix when relevant: switch to `JSON.stringify(ids)` or use a delimiter impossible in ids (e.g. `'\x00'`).

  Status: defer — current id scheme is safe. Add to checklist when next id format change is proposed.

- [ ] **500-task backlog performance on iPhone** — Codex 5b-5 Phase 3 noted: every render filters tasks twice, maps all rows, recreates dep strings, drag controllers track refs. No virtualization. iPhone rendering performance at 500 rows untested. Current largest project is ~20 tasks.

  Fix if needed: virtualized list (react-window equivalent for Preact) OR pagination ("show all" affordance with lazy-render in batches of 50).

  Status: 5b-9 phone test verification. Defer until profile shows actual jank.

# BACKLOG

Operational backlog for items committed to ship but not yet placed in a specific phase. Read by Dev Loop Protocol's Session Start (Step 4). The user can ask to tackle items at any time. New items captured per Dev Loop's Backlog Capture rule (Phase X scope-creep deferrals land here).

## Migrated from PHASES.md "Future considerations" (2026-05-15)

- [x] **Motion polish — final sweep before V2 ship** — **SHIPPED (v2-motion merge).** Surface entry animations (Board/Focus/modal/Onboard steps), row fade-out on ✓, header count ticks, ghost-slot + longpress fill-ring (Decision 10, Board + modal together), ambient mode tints (Phase 6), all under prefers-reduced-motion kill. The committed deliverable for V2 ship is delivered.
- [x] **Latent parallel-write race in api/backlog.js** — **FIXED in V2 hardening pass.** All 8 mutating op handlers serialized: writeBacklog first, touchRegistry only after it lands — and AWAITED, not fire-and-forget (Vercel can freeze the function once the response returns; Codex flagged). Mirrors the 899c02d api/project.js fix per archived open-item #8's prescription. Single commit, all handlers, per this entry's own requirement.
- [ ] **Drag-reorder race with concurrent fetchBoard** — Codex flagged during 5a-7 review. Drag controller stores `fromIdx`/`toIdx` from pointer-down through pointer-release; if `fetchBoard` or another mutator changes `top[]` mid-drag, the reorder applies stale indices to fresh data and could move the wrong task.

  Defensive bounds check in ProjectCard catches the list-shrunk case (partial mitigation). Full fix requires `drag.js` extension (onDragStart callback) which would ripple to OnboardReview — out of scope for 5a-7.

  Status: ship-and-revisit — address if wrong-task-reordered behavior surfaces in real use during dogfood. Otherwise revisit Phase 6+ if needed.

## 2026-05-15 — captured during 5b-3 (backlogStore)

- [x] **Concurrent same-modal mutator rollback can resurrect/undo later mutations** — **FIXED in 5b-10.** Patch-based rollback implemented across all 5 backlogStore mutators: each captures its specific change (removed task object, original urgent flag, original text, original order+priorities) and reverses ONLY that change against CURRENT store state on failure. Same-entity overlaps additionally guarded with conditional rollback ("only restore if current still equals my optimistic value"). Regression test: backlog-detail-flow test 14 (failing edit does NOT resurrect a concurrently-deleted task).

  Accepted residual (documented in backlog.js): complete/delete rollback re-insertion can carry pre-edit fields if an edit on the SAME task was in flight when removed — display-stale until next openProject; backend correct.

- [x] **boardStore.fetchBoard out-of-order response race** — **FIXED in V2 hardening pass.** fetchGen generation counter inside fetchBoard; only the latest in-flight fetch may write. Older responses landing late are discarded.
- [x] **fetchBoard loading flicker on modal-action sync** — **FIXED in V2 hardening pass.** fetchBoard({silent:true}) skips the loading flag; all 6 backlogStore cross-store sync sites use it. Initial loads keep the flag.
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

- [ ] **Keyboard + screen-reader accessibility for BacklogDetail modal** — **PARTIALLY closed in V2 hardening pass:** (1) focus moves to the close button on mount ✓; (2) Escape dismisses the modal (row-edit Esc consumes its event first via stopPropagation) ✓. Remaining: (3) background inert for assistive tech; (4) aria-live counts. Both stay deferred per the original single-user/touch-primary rationale.
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

- [x] **drag.js mixed-height row drop-index inaccuracy** — **FIXED in 5b-10.** engage() now snapshots every row's static center Y; toIdx is the nearest slot center to the dragged row's translated center (height-agnostic; reduces to old behavior for uniform rows). Regression test: mobile-backlog M3 (short row dragged just past a tall 2-line row's center swaps ONE slot — old math skipped two). Benefits Board automatically (shared library).

- [x] **longpress.js timer can fire on detached element** — **FIXED in V2 hardening pass.** Timer callback checks `state.el.isConnected` before firing onLongPress; gesture dropped if the row unmounted mid-hold. No more doomed mutations on removed rows.
- [x] **Ghost-row drop indicator (mockup 33 / Decision 10)** — **SHIPPED in motion-polish sweep**, Board + modal together via drag.js (.drag-ghost-slot injected at the dragged row's origin box, dashed cyan, ghost-blink). Decoration-only, try/catch-guarded, removed on cleanup.
- [x] **Amber longpress fill-ring (mockup 33 / Decision 10)** — **SHIPPED in motion-polish sweep**, Board + modal together via :has()-based row ::after over the handle rail (conic-gradient stepped fill matching the 500ms gesture; reduced-motion fallback).
- [x] **boardStore.completeTask recurring-task filter bug** — **FIXED in motion-polish sweep.** Optimistic complete keeps daily-recurring rows in top[]; api/backlog.js GET top[] entries now carry `recurring` so the frontend can know. Board TaskRow skips the completion fade for recurring rows.
- [ ] **Recurring task done-today visual indicator in modal + Board** — Frontend fix above keeps recurring tasks visible after completion. **Partial fix in 5b-10:** modal rows now show a 700ms green acknowledgment flash on recurring ✓ (CSS pulse, reduced-motion fallback) + in-flight guard prevents double-POST SHA conflicts. Remaining: a PERSISTENT "✓ DONE TODAY" indicator comparing last_completed to today, designed properly with the recurring-task UX (Phase 6+; Board parity then too).

  Status: flash shipped; persistent indicator deferred to recurring-task UX design.

- [x] **Concurrent same-modal mutator rollback — RE-RATED SEVERITY (3x)** — **FIXED in 5b-10** (see the resolved 5b-3 entry above for implementation details: patch-based rollback + conditional same-entity guards + regression test 14). This duplicate-tracking entry closed with it.

- [ ] **In-flight drag silently canceled if section membership changes** — Codex 5b-5 Phase 3 flagged. `BacklogList` rebuilds urgent/normal drag controllers when section id lists change. If a separate mutator (long-press toggle on another row, complete/delete on another row) changes section membership mid-drag, the old controller is destroyed and the user's pointer-down is orphaned. Drag doesn't corrupt state — it just dies; user lifts finger and re-drags.

  Fix would require persistent controllers across re-renders OR pausing section rebuilds while drag is active.

  Status: defer — behavioral concern only, not data corruption. Low-frequency in single-user. Revisit if dogfood reports "drag stopped working mid-action."

- [ ] **`.join(',')` useMemo dep collision with comma-in-id schemes** — Codex 5b-5 Phase 3 noted: current ids are `<prefix>-NNN` (no commas) so the stringified dep is safe. If future id scheme allows commas (e.g. user-named ids), `['a,b', 'c']` and `['a', 'b,c']` would both stringify to `a,b,c`, skipping a needed controller rebuild.

  Fix when relevant: switch to `JSON.stringify(ids)` or use a delimiter impossible in ids (e.g. `'\x00'`).

  Status: defer — current id scheme is safe. Add to checklist when next id format change is proposed.

- [ ] **500-task backlog performance on iPhone** — Codex 5b-5 Phase 3 noted: every render filters tasks twice, maps all rows, recreates dep strings, drag controllers track refs. No virtualization. iPhone rendering performance at 500 rows untested. Current largest project is ~20 tasks.

  Fix if needed: virtualized list (react-window equivalent for Preact) OR pagination ("show all" affordance with lazy-render in batches of 50).

  Status: 5b-9 phone test verification. Defer until profile shows actual jank.

## 2026-06-09 — captured during close-out date correction

- [ ] **reviewer-context.md auto-learning section over cap (29 entries vs 20)** — Dev Loop's Auto-Learning rule requires consolidating the oldest entries into higher-level patterns when the list hits 20; keeping it scannable preserves its value for future council assembly.

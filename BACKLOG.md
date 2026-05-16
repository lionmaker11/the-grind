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

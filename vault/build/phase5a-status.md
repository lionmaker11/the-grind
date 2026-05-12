# Phase 5a — pre-merge status (as of 2026-05-12)

## What shipped

Phase 5a finished the Board so the user can act on tasks — check off, drag-to-reorder, toggle urgent, launch into Focus, hit EXECUTE — instead of seeing them as a read-only display. Closes the gap between R5b's onboarding-can-write and a usable end-to-end V2. Spans 11 commits (8 sub-step code commits + 3 polish-log / fix commits) from `f8ae3d7` (5a-1, May 9 2026) to `7dad4d6` (5a-8, May 12 2026).

5a-9 (this status report) gates phone test. 5a-10 is the phone test itself, 5a-11 is the merge to main (closing both R5b and Phase 5a in one move — they've been bundled on `v2-phase4` per the R5b-9a status report's merge plan).

## Commits in Phase 5a

Grouped by sub-step. Chronological, newest first.

| Sub-step | Hash | Subject |
|----------|------|---------|
| 5a-1 | `f8ae3d7` | lightweight spec doc |
| 5a-2 | `d750f42` | close open #20, fix App.jsx stale comment |
| 5a-2 fix | `e4aa388` | include App.jsx comment change missed by d750f42 (case-mismatch follow-up) |
| 5a-3 | `cee52b1` | backend urgent-first sort + urgent in GET top entries |
| 5a-4 | `db3581d` | boardStore mutators (completeTask, toggleTaskUrgent, reorderTopThree) |
| 5a-5 | `cf2350c` | focusStore + Focus stub + launchTask + closeOnboard cleanup |
| 5a-6 | `09cb806` | TaskRow rebuild (Board) |
| 5a-7 polish-log | `51a0c43` | chore: log drag-reorder race polish item for Phase 5a pre-merge |
| 5a-7 | `38c0077` | ProjectCard + Board EXECUTE + backend pending-count fix |
| 5a-8 deferral | `11e3152` | defer ghost-row to post-phone-test; renumber 5a sub-steps |
| 5a-8 | `7dad4d6` | Playwright board-flow.spec.js + mock op branching + fixture/testid prep |

Two multi-commit sub-steps:
- **5a-2 shipped as a pair** — original commit + follow-up that caught a macOS-case-insensitive vs git-case-sensitive `git add` no-op. The original commit message promised an App.jsx change that didn't actually stage; the fix commit closed it.
- **5a-7 + 5a-8 each have a paired polish-log chore commit** flagging deferrals (drag-race race condition, ghost-row internal-inconsistency). Both deferrals logged in `vault/build/PHASES.md` Phase 5a section for phone-test verification.

## Test coverage

19 Playwright tests passing on chromium, 3 workers, total runtime ~20s.

**Board flow (7 new tests, board-flow.spec.js):**

1. **Render + urgent-first sort** — POPULATED_REGISTRY renders three project panels; lionmaker-systems' top[0] is the urgent task (despite higher priority number); header reads "1 URGENT / 3"; non-urgent rows follow in priority order.
2. **Check-off** — tap ✓ on non-urgent task: row disappears, header drops to "1 URGENT / 2". Tap ✓ on urgent task: header drops to "0 URGENT / 1" — verifies `urgent_count` optimistic delta (Codex IMPORTANT finding from 5a-7).
3. **Drag-reorder** — manual pointer sequence (`mouse.move` → `mouse.down` → `mouse.move(target, {steps:10})` → `mouse.up`) reliably triggers drag.js's 8px engage threshold. `op:reorder` POST captured with correct new order; DOM reflects new order optimistically.
4. **Long-press urgent toggle** — 650ms hold on `.task-text`; `op:toggle_urgent` POST captured with `urgent: true`; row gains `.urgent` class; header increments.
5. **Launch via ▶** — Focus mounts with task text; ← BOARD returns; Board re-renders with task still present.
6. **EXECUTE** — Focus mounts with `summary[0].top[0]` (urgent-first sorted top-most), confirming `topMostTask()` helper picks the right target.
7. **Empty Board** — `BOARD_EMPTY_TOP_REGISTRY` (projects exist with empty `top[]`) triggers Board's `allEmpty` branch; `board-empty-state` visible; `board-execute` not in DOM.

**Onboard flow (12 prior tests, onboard-flow.spec.js):** unchanged from R5b-8a/8b. All 11 onboarding scenarios + 1 muse-loop test still green.

**Playwright drag achievement worth noting:** R5b-8a's `onboard-flow.spec.js` test 2 explicitly skipped drag tests citing Playwright unreliability ("drag-to-reorder is explicitly SKIPPED in this test. drag.js uses pointermove thresholds Playwright's drag helpers don't trigger reliably"). 5a-8 attempted the manual pointer sequence anyway and it worked first try. **OnboardReview's deferred drag tests could now be unblocked in Phase 5b+ if desired** — leverage point for future test coverage without modifying drag.js.

**Bundle at HEAD (under DESIGN.md budget):**
- JS: 69.97 KB raw / **22.28 KB gzipped** (budget: <50 KB gz)
- CSS: 43.55 KB raw / **7.99 KB gzipped** (budget: <20 KB gz)

**What's NOT tested at E2E level:**
- Optimistic-update rollback paths — mock doesn't simulate failure; verify via phone test by watching for stale state after network drops.
- Mock-vs-real divergences inherited from R5b (see Untested section below).

## What's locked from the spec

Verified against `vault/build/phase5a-spec.md`:

- **Decision 1 (Check-off semantics)** — `status:'done'` flip, kept in vault. ✓ Backend `op:complete` already existed pre-phase; frontend `completeTask` mutator wired in 5a-4.
- **Decision 2 (Reorder mechanism)** — `op:reorder` with top-3 IDs only; backend appends rest preserving relative order. ✓ `reorderTopThree(projectId, newOrderIds)` in 5a-4 + ProjectCard drag callback in 5a-7.
- **Decision 3 (Top-3 sort: urgent first)** — backend-side via `sortByPriority`, `urgent` field added to GET top entries. ✓ 5a-3 commit, applied universally across all 6 `sortByPriority` call sites.
- **Decision 4 (EXECUTE button)** — launches top-most task across all projects via `topMostTask()` helper. Not rendered when Board empty. ✓ 5a-7 Board.jsx rewrite.
- **Decision 5 (Launch-to-Focus stub)** — state-store view switch (`focusStore` + App.jsx render conditional). Stub component shows task text + back button; structural frame matches mockup 06. ✓ 5a-5.
- **Decision 6 (Ghost-row)** — **DEFERRED** to post-phone-test. 5a-8 reading surfaced internal spec inconsistency (prose says pointer-following; mockup shows stationary-at-origin). Documented in spec + PHASES.md polish list. See "Polish deferrals" below.
- **Decision 7 (Long-press for urgent on Board)** — 500ms hold on `.task-text`, reuses `lib/longpress.js`. ✓ 5a-6 TaskRow rebuild.

Spec deviations made during implementation (each documented in the relevant commit):
- **focusStore shape** includes `activeProjectId` beyond strict spec — caller (launchTask) already had it; carrying it through avoids a future back-trace lookup when Phase 6's real Focus needs project context for the project chip.
- **closeOnboard cleanup** added — calls `focusStore.clear()` to prevent stale activeTaskId from re-mounting Focus after onboarding closes. Not in spec; identified during 5a-5 implementation.
- **`task_count` semantic bug** fixed in 5a-7 as part of the backend pending-count tweak (was counting `status:'done'` entries; now pending-only). Was a pre-existing bug, exposed by Board's new header.
- **`urgent_count` optimistic-delta tracking** in 5a-4 mutators — addresses Codex IMPORTANT finding from 5a-7 review (header would show stale urgent count between optimistic mutation and next fetchBoard).

## Polish deferrals (logged for phone-test verification)

Two items deferred during 5a, both logged in `vault/build/PHASES.md` Phase 5a "Known polish before merge" sub-section:

1. **Drag-reorder race with concurrent fetchBoard** — Codex flagged during 5a-7 review. The drag controller stores `fromIdx`/`toIdx` from pointer-down through pointer-release; if `fetchBoard` or another mutator changes `top[]` mid-drag, the reorder applies stale indices to fresh data and could move the wrong task. Defensive bounds check in ProjectCard catches the list-shrunk case. Full fix requires drag.js extension (onDragStart callback) which would ripple to OnboardReview — out of 5a-7 scope. If phone test surfaces wrong-task-reordered behavior, address in a dedicated commit before 5a-11 merge.

2. **Ghost-row drop indicator** — original 5a-8 deferred during reading pass. phase5a-spec.md Decision 6 is internally inconsistent (prose says pointer-following indicator; mockup 33 shows stationary-at-origin ghost-slot). For a 3-row top-3 list the existing drag feedback (cyan lifted row + sibling shift) is already informative. Phone test verifies whether absence of ghost-row feels confusing in real use; implement based on observed need, or close as no-fix.

## Open items at merge time

Status notes below reflect end-of-Phase-5a state. Carry-forward items from R5b (#6, #8) were not touched in Phase 5a; their statuses are unchanged.

| # | Title | Current status |
|---|-------|----------------|
| 2 | App.jsx re-open loop on successful onboarding | **OPEN** — phone-test gate. R5b shipped onboarding; 5a-5 added `focusStore.clear()` in `closeOnboard` which may have side effects on re-open behavior. Verify cleanly. |
| 4 | Drag heterogeneous-row jitter | **PARTIALLY MITIGATED** — 5a-6 TaskRow uses `wrap2` for uniform `min-height: 72px` rows within each project. Drag math should hold under uniform-height assumption. Phone test verifies. |
| 6 | Extraction quality on natural speech | **OPEN — watch in dogfood** (R5b carry-forward, no Phase 5a touch). |
| 8 | Latent parallel-write race in api/backlog.js op:add | **OPEN — watch in dogfood** (R5b carry-forward, no Phase 5a touch). |
| 20 | Board has no manual-entry affordance for onboarding | **RESOLVED in 5a-2** as no-fix (spec misread; voice-file via Muse is the design intent). |
| 21 | Match-toggle button label is the toggle target | **OPEN — Phase 8 polish** unless phone test surfaces actual confusion. |

New items surfaced during Phase 5a: **none** — every 5a-discovered concern either landed as a fix (Codex `urgent_count` finding) or got logged as a polish deferral (drag-race, ghost-row).

## What to look for during phone test (5a-10)

Verify on real iOS Safari device against the v2-phase4 Vercel preview URL. Test path: from a populated vault, Board renders directly (no `?force-onboard=1` needed unless re-testing the onboarding flow).

**Triage as you go:** anything in this checklist that produces wrong data (wrong task affected, lost state, can't recover) is a BLOCKER — stop testing further and tell advisor. Anything that's visually off but functionally correct is POLISH — note it and keep going. If unsure, file it as ambiguous and ask. See "Recommended merge gate" section below for the full triage rules.

### Board surface
- Top-3 per project renders with urgent-first sort (visible amber rail on urgent tasks; amber-tinted drag-handle border)
- "N URGENT / TOTAL" header reflects actual counts (urgent task is amber-glowing; non-urgent count is text-dim)
- "+ NEW PROJECT" button still wires to `museOpen` with prefill (NOT openOnboard — verifies 5a-2 design)
- Heartbeat dot still renders recency cue (replaced the old days-label without functional regression)
- Empty Board state (after completing all tasks): EmptyState renders, EXECUTE NOT rendered

### Task interactions
- Tap ✓ on a task — disappears from Board immediately (optimistic); vault file updates on next sync
- Tap ✓ on the urgent task — header `urgent_count` decrements correctly (the 5a-7 delta-tracking fix)
- Tap ▶ on a task — Focus stub renders with task text; ← BOARD link returns to Board state preserved
- Long-press on `.task-text` (~500ms hold) — amber outline pulse during hold (longpress-active), then row gains urgent state on release, header `urgent_count` increments
- Long-press again on the same task — urgent removed, header decrements

### Drag-to-reorder (the critical test on real device)
- Grab drag handle, drag a task within a project's top-3 — smooth motion, sibling rows shift to make space
- Drag works for both urgent and non-urgent tasks
- After release, drag persists (refresh the page — server should reflect the new order)
- **Heterogeneous-row jitter check** (open #4) — verify smooth motion when tasks have different visible content lengths (wrap2 enforces uniform 72px min-height, but does feature actually hold under touch?)
- **Cross-project drag** — NOT supported in 5a (each project has its own drag controller). Verify it doesn't break: dragging from one project should not allow drop into another.

### EXECUTE
- Tap EXECUTE on populated Board — Focus mounts with the urgent-first top-most task across all projects (first project's first row after backend sort)
- EXECUTE not rendered on empty Board (verify on a project where all tasks are done)

### Focus stub
- Task text renders correctly
- ← BOARD link returns to Board
- TopBar + Muse FAB still visible during Focus (per Decision 5 — Phase 6 will fill in the real Focus surface; the chrome stays consistent)

### Onboarding flow (post-R5b verify)
- Voice capture → review → LOCK IT IN → done flow still works
- After onboard close, Board renders cleanly with new projects (verifies open #2 — re-open loop guard)
- The 5a-5 `closeOnboard → clearFocus()` addition doesn't break anything (e.g., focus stays cleared after re-opens)

### Known fragile (Playwright skipped, must verify manually)
- **Long-press timing on real iOS Safari** — Playwright simulated 650ms; iOS Safari's pointer-event timing may differ. Verify the 500ms threshold actually fires reliably on touch.
- **Drag on touch** — Playwright used mouse events; touch events compose differently with `setPointerCapture`. drag.js's window-level pointermove listeners should handle it, but verify the 8px move threshold doesn't conflict with iOS Safari's scroll-detection on the same gesture.

### Known UX flags to watch
- **Ghost-row deferred** — does absence feel like the drag gesture lacks commitment feedback? If yes, implement (likely pointer-following option a). If no, close as no-fix.
- **Drag race condition** — try to repro: drag a task while Muse FAB is reachable, ideally with a Muse action firing concurrently. If wrong-task-reordered surfaces, urgent fix before merge.
- **Match toggle two-tap from undecided** (open #21) — Phase 8 polish unless phone test surfaces actual confusion. Likely won't surface in normal use (only on low-confidence matches).

## Recommended merge gate

**Blockers (any of these blocks 5a-11 merge to main):**

- Data loss in mutations — task completed under wrong project, drag-reorder applies to wrong rows, urgent flag flips on wrong task
- Drag-to-reorder non-functional on touch (gesture doesn't fire at all on iOS Safari)
- Long-press non-functional on real iOS Safari (gesture-commit feedback missing OR urgent doesn't flip)
- Focus stub broken (doesn't mount, can't return to Board, blank screen)
- EXECUTE button fires the wrong task (would be a `topMostTask` helper bug)
- App.jsx re-open loop returns after onboarding success (#2 verification fails)

**Non-blockers (go to polish list, do not block merge):**

- Visual jitter during drag (open #4 — investigate if severe; defer if minor)
- Ghost-row absence (decide based on real use)
- Match toggle two-tap UX (open #21)
- Cosmetic CSS drift

If a finding is ambiguous between blocker and polish, file it and ask. Better to delay merge by a day than ship data-loss.

## Untested in Phase 5a (mock-vs-real divergences)

Inherited from R5b's status doc plus Phase 5a additions:

- **Slug collision on `/api/project` op:add** (R5b carry-forward) — real backend returns 409; mock returns success with the same slug. Test 8 of R5b sidesteps via rename. Real backend behavior under collision unverified.
- **Real Whisper transcription round-trip** (R5b carry-forward) — mocks return canned text; real Groq/Whisper handles audio quality, latency, accuracy variances.
- **Backend write race conditions in api/backlog.js op:add** (open #8) — same shape as the resolved api/project.js bug; not yet observable; mirror the fix if it surfaces.
- **Optimistic-update rollback paths** (NEW for Phase 5a) — mock doesn't simulate failure; 5a-4's mutators rollback on error but rollback isn't E2E-tested. Phone test verifies indirectly by watching for stale state after network drops.

## Post-merge follow-up

- **Phase 5b** wires Backlog detail modal (full task list per project, pomodoro glyphs, aggregate counts). Mockups 23/24/33. Drag-to-reorder primary mechanism in 5b (5a's reorder is limited to top-3).
- **Phase 6** builds real Focus surface (replaces 5a-5 stub). Ring SVG port from mockup 06; timer state machine; Muse integration during focus session.
- **vault/build/phase5a-spec.md Decision 6 (ghost-row)** revisited based on phone-test findings — implement, change shape, or close as no-fix.
- **vault/build/phase4-open-items.md archived** after merge (R5b artifacts close out; archive moved alongside `phase4-session-handoff.md`).
- **PHASES.md "Current state" block** refreshed at merge time — currently still claims R5b-era HEAD, needs update to v2-phase4's `7dad4d6` (or main HEAD post-merge).
- **Playwright drag-test pattern from 5a-8** — discovered during 5a-8 implementation that Playwright's `mouse.move(target, {steps: 10})` triggers drag.js's 8px engage threshold reliably. R5b's deferral of drag tests (citing Playwright unreliability) was overcautious by 5a-8's evidence. OnboardReview's deferred drag tests can be unblocked in Phase 5b or a dedicated test-coverage commit. Pattern reference: `v2/tests/board-flow.spec.js` test 3 for the working sequence.

## Verification command snapshot (run before 5a-10 begins)

```
git log --oneline main..v2-phase4 | wc -l    # expect 66
git status                                    # expect clean working tree
cd v2 && npm run lint                         # expect clean (zero exit)
cd v2 && npm run build                        # expect <50 KB JS gz, <20 KB CSS gz
cd v2 && npm test                             # expect 19/19 passing in ~20s
```

# Phase 5b — pre-merge status (as of 2026-05-15)

## What shipped

Phase 5b shipped the Backlog Detail modal — a full-task-list-per-project view launched from a chevron on Board's project cards. Task rows support drag-reorder within URGENT/NORMAL sections, long-press urgent toggle, tap-to-edit text, check-off, and delete. First sub-step run end-to-end under the new Dev Loop Protocol activated in commit `c4d39fc`.

Phase 5b work spans 9 historical commits from `8eda864` (5b-1 spec doc, May 14) to `cede4c1` (5b-8 Playwright tests, May 15) — 8 sub-step commits + 1 Dev Loop setup commit. **The merge ceremony only moves 8 branch-only commits because 5b-1's `8eda864` already landed on main** before the working branch was created. 5b-9 (this status report) gates the 5b-10 phone test; merge to main happens after 5b-10 verifies the dogfood-watch criteria.

## Dev Loop activation context

5b-3 onwards ran under the Dev Loop Protocol (replaces the historical `/api/*` and `/vault/**` strict-mode carve-outs in CLAUDE.md). Each sub-step ran the full 5-phase loop: Execute → Codex standard review → Codex adversarial review → Council debate → Gate decision. Auto-ship CLEAN runs without diff-show; flag only on architectural changes, manual testing, or genuine information gaps.

Cycle stats across 5b-3 → 5b-8 (6 Dev Loop cycles):
- ~108 review findings surfaced (Codex standard + adversarial + council)
- ~40 fixes landed inline; ~25 deferred to BACKLOG.md with explicit dogfood-watch criteria
- 5 phone test agenda items added to reviewer-context.md for 5b-10
- 2 real production bugs surfaced WHILE WRITING 5b-8 tests (BacklogDetail render conditional swallowed BacklogList when store.error truthy; openProject 404 left projectName blank). Both fixed in 5b-8 commit. Distinct value-add of the test phase as a design-review surface, not regression-catch.

## Commits in Phase 5b

Grouped by sub-step. Chronological, oldest first.

| Sub-step | Hash | Subject |
|----------|------|---------|
| 5b-1 | `8eda864` | spec doc for backlog detail modal *(landed direct on `main` before working branch was created)* |
| 5b-2 | `42142a5` | backend ops update_task_text + delete_task |
| Dev Loop setup | `c4d39fc` | dev loop protocol setup — replaces /api/* + vault carve-outs with full auto-ship |
| 5b-3 | `283be9a` | backlogStore + mutators (full Dev Loop cycle) |
| 5b-4 | `d4cf0bf` | BacklogDetail modal frame + render switch (Dev Loop cycle) |
| 5b-5 | `4d77797` | TaskRow + URGENT/NORMAL sections (Dev Loop cycle) |
| 5b-6 | `58acece` | inline edit-text on backlog task rows (Dev Loop cycle) |
| 5b-7 | `a1ec328` | project-card chevron affordance (Dev Loop cycle) |
| 5b-8 | `cede4c1` | Playwright tests for backlog modal (Dev Loop cycle) |

Total: 9 commits in phase. **8 commits ahead of `main`** (5b-1's `8eda864` is already on main; the merge ceremony moves the remaining 8 commits from `42142a5` onwards).

## Test coverage

32 Playwright tests passing on chromium, total runtime ~14s.

**Backlog Detail flow (13 new tests, backlog-detail-flow.spec.js):**

1. **Chevron open** — tap chevron on Lionmaker Systems → modal mounts with project name "Lionmaker Systems" + 4 pending tasks (1 done filtered) + section labels + counts "1 URGENT / 4 TASKS"
2. **Drag-reorder NORMAL** — drag t-lm-2 up; `op:reorder` POST captures full-list payload `[t-lm-urgent, t-lm-2, t-lm-1, t-lm-3]`
3. **Long-press urgent toggle** — 650ms hold on text; `op:toggle_urgent` POST + row gains `.urgent` class + header increments
4. **Edit via tap + Enter** — tap text → input mounts focused → fill new text → Enter → `op:update_task_text` POST + DOM updates with new text
5. **Check** — tap ✓ → `op:complete` POST + row removes + count decrements + section labels still render unconditionally
6. **Delete** — tap × → `op:delete_task` POST + row removes permanently
7. **Close modal** — tap ▼ close button → modal unmounts, Board re-mounts with chevron visible
8. **Empty project** — open Motor City Deals (0 tasks) → `backlog-modal-empty` placeholder visible, NO section labels (BacklogList not mounted)
9. **Esc cancel** — type then Esc → no POST + original text preserved
10. **Save-failed retry** — mock returns 500 for "Pizza" → row enters save-failed state with red border + retry button → tap retry → input pre-populated with "Pizza" (lastAttempt preservation)
11. **Drag suppression while editing** — fill 'Pizza', attempt drag on suppressed handle → drag.js blocked (no reorder POST) but blur commits dirty edit (mock 500 → retry button appears) → no rollback race
12. **openProject 404** — registry has lionmaker but backlogs map omits it → modal-level error state with project_id visible (so user knows WHICH project failed)
13. **Recurring task complete** — tap ✓ on fit-001 (daily-recurring) → POST fires + row STAYS visible per 5b-5 fix + check button still enabled + no save-failed UI

**Board flow (8 prior tests, board-flow.spec.js):** unchanged from 5a-8. All 7 board scenarios + 1 muse-loop still green.

**Onboard flow (11 prior tests, onboard-flow.spec.js):** unchanged from R5b-8/8b.

**Bundle at HEAD (under DESIGN.md budget):**
- JS: 78.74 KB raw / **24.43 KB gzipped** (budget: <50 KB gz; ~25KB headroom)
- CSS: 51.06 KB raw / **8.86 KB gzipped** (budget: <20 KB gz; ~11KB headroom)

Compared to Phase 5a baseline (`22.28 KB` JS gz / `7.99 KB` CSS gz from phase5a-status.md): Phase 5b added **~2.15 KB JS gz and ~0.87 KB CSS gz** for the modal frame + row component + section list + edit input + chevron + styles. Well below budget.

**What's NOT tested at E2E level:**
- Optimistic-update rollback paths beyond test 10 (single-row failure) — concurrent same-modal mutator scenarios deliberately not codified per Codex+Council guidance (don't test for known-broken behavior; 5b-10 phone test owns dogfood-watch verification)
- Modal scroll behavior with long task lists (5b-10 phone test)
- iOS keyboard occlusion of edit input in lower half of modal (5b-10 phone test)
- 500-task perf (5b-10 phone test)

## What's locked from the spec

Verified against `vault/build/phase5b-spec.md`:

- **Decision 1 (Modal mount strategy):** Render switch in App.jsx uses `Onboard > Focus > BacklogDetail > Board` precedence. Focus and BacklogDetail mutually exclusive (`activeTaskId ? Focus : openProjectId ? BacklogDetail : Board`).
- **Decision 2 (Modal overlay pattern):** `position: fixed; inset: 0; height: 100vh + 100dvh; padding-top: var(--top-bar-h); background: var(--bg);` — proven Phase 5a-10 iOS Safari pattern. NO `min-height: 100%`.
- **Decision 3 (Project-card chevron):** Visible chevron at right edge of project-head, after urgent-count. 44x44 hit target. Card body non-tappable (Krug position).
- **Decision 4 (4 gestures per row):** Drag-handle (drag.js), task text (long-press toggle urgent + tap-to-edit), check, delete. No swipe.
- **Decision 5 (Backend ops):** `op:update_task_text` + `op:delete_task` shipped in 5b-2. Within Pattern-1 budget (1 slot used; slot 2 unused).
- **Decision 6 (backlogStore shape):** Separate from boardStore. Fields openProjectId, tasks, projectName, taskCount, urgentCount, loading, error. Mutators inherit Phase 5a-4 optimistic-update + rollback convention.
- **Decision 7 (Edit-text interaction):** Chose input element with autoFocus + select-all over contentEditable. Commit on Enter or blur, cancel on Esc/empty/unchanged. Save-failure surfaces visibly per Daily-driver hard requirement.
- **Decision 8 (URGENT/NORMAL grouping):** Section labels render unconditionally. Per-section drag controllers; cross-section transitions via long-press.
- **Decision 9 (Modal pre-empts only Board):** Onboard precedence preserved. Focus + modal mutually exclusive. close() triggers fetchBoard for cross-store sync.
- **Decision 10 (Ghost-row + longpress-ring):** **DEFERRED to motion-polish sweep** (BACKLOG.md). Technical reality: lib/drag.js + lib/longpress.js don't currently render the visuals; extending them would ripple to Board's controllers. Per 5b-5 council ruling + reviewer-context "Modal-Board visual parity" note (`reviewer-context.md` Pattern Promotion section): solo-operator velocity prefers shipping functional drag/longpress with parity to Board over diverging visual treatment. Both Board + modal will receive the polish visuals together during the motion-polish sweep, preserving one mental model across surfaces.

**Spec deviations / additions worth flagging:**
- 5b-6 added 6 component-state pieces to BacklogTaskRow (editing, saveFailed, lastAttempt, inputRef, committingRef, mountedRef) beyond the spec's "tap-to-edit" wording. All defensive — Codex flagged the underlying patterns (double-commit guard, lifecycle leak, lastAttempt preservation across rollback). Architect noted threshold at 8+ state pieces or 250+ lines should trigger row component split.
- 5b-7 added `?force-backlog=PROJECT_ID` URL dev override to match existing `?force-onboard=1` pattern. Enables manual phone test of modal frame before chevron wires it. Will remove or convert to permanent deep-link affordance after Phase 5b ships.

## Known issues entering 5b-10 phone test

All deferred items live in `/BACKLOG.md` with explicit dogfood-watch criteria. **Phone-test-relevant** items re-stated here for focus during 5b-10 dogfood (other BACKLOG entries are background polish items not directly dependent on phone-test signal):

- **Concurrent same-modal mutator rollback (severity elevated 3x across 5b-3 / 5b-5 / 5b-6).** Snapshot-based whole-array rollback can resurrect/undo other in-flight mutations. 5b-6 makes this a TRIVIAL 2-tap workflow trigger (edit row A, blur, edit row B, blur — both editText calls capture whole-array snapshots concurrently). Mitigations applied: disabled check + delete + drag-handle while editing prevent same-row edit→destructive races. **Trigger criterion for forced fix:** any dogfood report of "edit reverted", "deleted task came back", or "completed task reappeared" → implement patch-based rollback (~80 lines) before merge.

- **drag.js mixed-height row drop accuracy** (5b-5 Phase 2). Library uses dragged-row's height as uniform-row assumption. Backlog rows wrap to 2 lines via wrap2 class → variable height. Short row dragged through tall rows can skip slots. **Trigger criterion:** "wrong row moved" reports. Library-level fix.

- **longpress.js timer fires on detached element** (5b-5 Phase 2). No destroy hook. If row unmounts mid-hold (concurrent mutator removes it), timer fires against detached element and calls toggleUrgent on missing taskId → backend 404. Low frequency.

- **Modal-only ghost-row + amber longpress-ring** (Spec Decision 10 aspiration). Deferred to motion-polish sweep.

- **Closed-modal failure swallowed** — no UI surface when in-flight mutator fails after modal close. Low frequency in single-user use.

- **boardStore.completeTask has the same recurring-task filter bug** as backlogStore had (fixed 5b-5). Pre-existing. Affects user completing daily recurring task from Board top-3 (vs from modal). Separate fix when recurring-task UX is designed properly.

- **Various polish/perf items** logged in BACKLOG.md and not directly phone-test-dependent: latent parallel-write race in api/backlog.js (item from archived phase4-open-items #8), motion polish final sweep, drag-reorder vs concurrent fetchBoard race (5a-7 carry-over), keyboard a11y (focus management, Escape, inert background, aria-live counts), boardStore fetchBoard out-of-order race, Board loading flicker on modal save, GitHub API pressure under modal-action spam, external-mutation invalidation while modal open, Muse FAB over modal stacked-modal accessibility ambiguity, `?force-backlog` initial-paint flash, duplicate fetchBoard on close, stale Board window post-close, in-flight drag cancellation on section change, `.join(',')` dep collision (theoretical), 500-task perf virtualization, sortByPriority/assignBucketedPriorities triplication extraction, recurring task done-today visual indicator.

## 5b-10 phone test agenda

11 explicit verification items. **Source of truth:** `reviewer-context.md` "5b-10 phone test agenda" section. Duplicated below for merge-packet convenience; if they diverge, reviewer-context wins.

1. Drag-handle scroll-blocking on left rail (5b-5 council)
2. Right-edge delete mis-tap during scroll (5b-5 council)
3. Multi-touch reorder (5b-5 council; theoretical only)
4. Recurring task ✓ feedback gap (5b-5 council; if confusion → add brief flash)
5. Resurrection scenario via concurrent mutator (5b-5 council; trigger criterion for patch-based rollback)
6. drag.js mixed-height row drop accuracy (5b-5 council)
7. 500-task backlog perf (5b-5 council)
8. Edit input keyboard occlusion in modal lower half (5b-6 council; iOS Safari)
9. Concurrent edit race intentional test with network throttle (5b-6 council)
10. Chevron reads-as-attached-to-count visual concern (5b-7 Codex)
11. Accidental chevron taps near header divider (5b-7 Codex)

## Merge ceremony facts (for future Claude sessions)

- **Current branch:** `v2-phase5b`
- **Branch tip:** `cede4c1` (5b-8 Playwright tests)
- **`main..v2-phase5b` count:** 8 commits (since 5b-1's `8eda864` is already on main)
- **Status doc location:** `vault/build/phase5b-status.md` (this file; will be tracked once 5b-9 commit lands)
- **Preview URL for 5b-10 phone test:** TBD. Run `vercel ls` after the 5b-9 commit pushes; Vercel auto-deploys phase branches and aliases at `the-grind-git-<branch>-thomas-typinskis-projects.vercel.app`. Past phase branches followed this pattern (5a-11 ceremony aliased `the-grind-git-v2-phase4-...`); verify before sending T.J. the URL.

## Merge plan

5b-10 phone test on iPhone with the deployed v2-phase5b preview URL. T.J. exercises the 11 agenda items + general dogfood. Expected outcomes:
- All items pass → 5b-10 commits a fixes-only file (e.g., the brief recurring-task feedback flash if confused) OR proceeds direct to merge ceremony if no fixes needed
- Critical items fail → dedicated fix commits before merge ceremony
- Non-critical items fail → log as known polish for motion-polish sweep, proceed to merge

Merge ceremony mirrors Phase 5a-11. Concrete steps:
1. Pre-merge sanity: `git status` clean on `v2-phase5b`; `npm test` 32/32 green; `npm run build` clean
2. `git checkout main && git pull --ff-only origin main`; verify `main..v2-phase5b` is 8 commits
3. `git merge --no-ff v2-phase5b` with descriptive merge commit
4. `git push origin main`; wait for Vercel deploy (`vercel ls --prod` → ● Ready); verify `the-grind-gold.vercel.app` serves new bundle (check JS hash differs from prior + new functionality reachable via chevron)
5. **Working docs that stay in `vault/build/`:** `phase5b-spec.md`, `phase5b-status.md`, `BACKLOG.md`, `reviewer-context.md` — all are authoritative references for future Claude sessions and audit-flow plugin
6. **No archive moves needed for Phase 5b** — phase4-r5b's archive of `phase4-open-items.md` + `phase4-session-handoff.md` was a one-time cleanup; Phase 5b never created equivalent working docs (BACKLOG.md absorbed that role)
7. `git branch -d v2-phase5b && git push origin --delete v2-phase5b` after deploy verifies healthy

After merge, Phase 6 begins (Focus surface + Ring timer per phase5b-spec.md "Phase 5b deprecations" — pomodoro estimate UX relocates here).

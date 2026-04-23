# Phase 4 — Open Items

Living document tracking known issues, design concerns, and deferred work surfaced during the Phase 4 rebuild. Each item has a status: OPEN, SCHEDULED, RESOLVED. This file closes (gets archived) when Phase 4 closes.

## OPEN — Must fix before Phase 4 ships

### 1. Merge-append bug in commit orchestrator Pass 3

**Surface:** `v2/src/state/onboard.js` — `commitOnboardingResults` Pass 3 (task attachment under committed projects).

**Bug:** For projects where user accepted MERGE (`matched_existing_id` present, `matches[tempId].merge === true`), Pass 1 stamps `backendId = matched_existing_id` without querying the existing backlog. Pass 3 then commits tasks with `order: tIdx` where `tIdx` is the extraction-time array index (0, 1, 2...). Backend splices at those positions → new tasks land at TOP of the existing backlog, pushing existing tasks down.

**Example:** User has existing Pallister with 8 tasks (orders 0-7). Opus extracts Pallister with 2 new tasks. User merges. Commit sends tasks at `order: 0` and `order: 1`. Backend splices each at position 0. Result: new tasks at positions 0-1, existing tasks shift to 2-9. User's existing ordering silently destroyed.

**Fix:** Pass 3 needs to query existing task count for merged projects and offset the order. Two options:

- (a) Frontend: before Pass 3 commits a merged project's tasks, fetch that project's backlog, read `tasks.length`, offset `order: existing_count + tIdx`
- (b) Backend: extend `op:add` to accept `order: 'append'` as a sentinel meaning "place at end"

Option (a) keeps backend clean but adds a network round-trip per merge. Option (b) adds a tiny backend surface but keeps commit serial.

**Schedule:** Fix as part of R5b OR a dedicated R6 commit before R7 tests.

### 2. App.jsx re-open loop on successful onboarding

**Surface:** `v2/src/app.jsx` line ~27.

**Concern:** App.jsx calls `openOnboard()` if some "vault empty" guard evaluates true on load. Successful onboarding → commit → done → `closeOnboard(true)`. Frontend Board re-fetches registry, now sees new projects. Guard should evaluate false.

**Risk:** If app.jsx's guard re-evaluates at the wrong moment (e.g., during the 1s done-delay before close), or if registry fetch races with close, could trigger a re-open loop. User finishes onboarding → gets dropped back into onboarding.

**Verification:** Phone test R5a end-to-end — complete full flow including LOCK IT IN, confirm UI closes cleanly to Board without re-opening onboarding.

**Schedule:** Verify during R5a phone test. If bug manifests, fix before R5b.

## SCHEDULED — Planned fixes

### 3. Unmount/abort race patterns (partially addressed)

**Surface:** Components that dispatch async results into the store — OnboardRecord, OnboardParsing (both handled in R5a via unmountedRef pattern). OnboardReview placeholder's `commitOnboardingResults` is NOT wrapped.

**Pattern:** If user exits mid-async, the in-flight promise resolves against a reset store. R3 actions are no-op-on-invalid-step, so symptoms are silent no-ops not crashes. But `commitOnboardingResults` does real backend writes via `projectOp` and `backlogOp` — those writes succeed even if the frontend store is dead. Committed data lands in vault with no UI feedback.

**Partially fixed:** OnboardRecord and OnboardParsing have unmountedRef guards. OnboardReview placeholder does not.

**Schedule:** R5b will rewrite OnboardReview; include the same guard pattern. Also, `commitOnboardingResults` itself could check `onboardStore.get().step !== 'committing'` between passes and abort. Both worth doing in R5b.

### 4. Drag utility heterogeneous-row assumption

**Surface:** `v2/src/lib/drag.js` — `onPointerMove` divides `delta / drag.rowHeight` where `rowHeight` is sampled from the dragged row.

**Concern:** Review screen lists may have heterogeneous row heights (project panels with variable task counts and optional notes). Sampling one row's height produces incorrect target-slot math on drag.

**Mitigation options:**

- (a) Upgrade drag utility: snapshot per-row rects at drag start, compute target by cursor-Y-vs-row-midpoint instead of delta-divided-by-uniform-height
- (b) Constrain each list to uniformly-sized rows at the component level (e.g., fixed-height task rows within a project panel; project panels can differ since they're a separate list)

**Schedule:** Evaluate during R5b CSS design. If mockup 40 shows heterogeneous rows within a single draggable list, upgrade drag utility before wiring. If rows are uniform within each list, keep current drag.js.

### 5. Committer identity auto-configured

**Surface:** Every commit on v2-phase4 shows `T. J. Typinski <tjtypinski@Lionmaker-Air.local>` as committer. Git auto-configured this from system hostname because no `user.email` is set in repo.

**Status:** Not a bug — it's a real identity, commits land correctly. But if T.J. wants GitHub contribution graph attribution tied to his GitHub account email, he'd want `git config user.email <github-email>` at his leisure.

**Schedule:** User discretion. Not a Phase 4 blocker.

## RESOLVED — Fixed during rebuild

### R6. Schema gap between R3 and R2 backend (resolved in R2.5)

R3 commits tasks with `urgent` + `order` fields. Original R2 op:add didn't accept these. R2.5 extended op:add with both fields. Resolved.

### R7. receiveExtraction signature mismatch (resolved in R5a)

OnboardParsing.jsx called `receiveExtraction(projects)` with old signature. R5a rewrote to pass full payload `{projects, orphan_tasks, clarification_needed}`. Resolved.

### R8. Onboard.jsx done-state teardown (resolved in R5a)

After successful commit, `step === 'done'` needed something to call `closeOnboard`. R5a's OnboardReview placeholder wires a 1-second-delay `useEffect` for this. Real OnboardReview in R5b will carry forward the same pattern.

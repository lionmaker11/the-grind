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

**Schedule:** Still open — needs verification during R5b phone test or earlier. Fix as part of R5b OR a dedicated R6 commit before R7 tests.

### 2. App.jsx re-open loop on successful onboarding

**Surface:** `v2/src/app.jsx` line ~27.

**Concern:** App.jsx calls `openOnboard()` if some "vault empty" guard evaluates true on load. Successful onboarding → commit → done → `closeOnboard(true)`. Frontend Board re-fetches registry, now sees new projects. Guard should evaluate false.

**Risk:** If app.jsx's guard re-evaluates at the wrong moment (e.g., during the 1s done-delay before close), or if registry fetch races with close, could trigger a re-open loop. User finishes onboarding → gets dropped back into onboarding.

**Verification:** Phone test R5a end-to-end — complete full flow including LOCK IT IN, confirm UI closes cleanly to Board without re-opening onboarding.

**Schedule:** Verify during R5a phone test. If bug manifests, fix before R5b.

### 6. Extraction quality when user speaks naturally

**Surface:** Opus extraction in `/api/chief.js` `op:onboard`.

**Observed (R5a phone test):** When T.J. spoke a freeform brain-dump, Opus merged unrelated tasks under a fabricated "Personal" project rather than mapping each task to the correct existing project or surfacing as orphans. Result: tasks landed in the wrong place silently.

**Concern:** The current extraction prompt + flow assume the user organizes their own thoughts by project. Real speech doesn't work that way. Need a flow redesign so the system can either (a) ask clarifying questions per ambiguous task, or (b) default ambiguous tasks to orphans for explicit assignment in Review, instead of inventing umbrella projects.

**Schedule:** Council deliberation on flow redesign. Target before Phase 4 closes; may push into Phase 5.

### 7. R5b needs fully editable Review

**Surface:** R5b OnboardReview rewrite (replaces the placeholder shell from R5a).

**Required affordances:**
- Rename project (inline edit on the project header)
- Split a task out into a different project (move task between project panels)
- Add a brand-new project (with optional starting tasks)
- Delete a project (and decide what happens to its tasks — drop or convert to orphans)
- Edit task text inline
- Toggle a task's `urgent` flag
- Assign an orphan to a project (existing or new)
- Reorder tasks within a project AND reorder projects in the list

**Why:** Without these, item 6 (extraction quality) becomes a hard blocker — user can't fix Opus's mistakes mid-flow and is forced to either accept bad data or bail out and start over.

**Schedule:** R5b. This is the bulk of R5b's scope.

### 8. Latent parallel-write race in api/backlog.js op:add

**Surface:** api/backlog.js op:add, after writeBacklog + touchRegistry.

**Concern:** `Promise.all([writeBacklog(...), touchRegistry(...)])` is the same pattern that caused the 899c02d parallel-write race in api/project.js. Two Contents API writes against the same branch ref, independent tree computations, GitHub silently dropping one under load. api/backlog.js hasn't produced an observable bug yet — likely because its writes are less frequent than onboarding's project-creation burst — but the shape is identical.

**Fix if it surfaces:** serialize — backlog first, registry touch second, registry only if backlog landed. Mirror the api/project.js fix pattern.

**Schedule:** Not fixed in R5b. Watch during phone test and dogfooding. If any write loss surfaces, dedicated commit.

### 9. Copy manifest spec defects — mic-gesture copy and Parsing rationale

**Surface:** vault/build/phase4-flow-redesign.md § "Copy manifest" rows for OnboardAsk (capture-ask mic CTA), OnboardRecord (stop CTA), and OnboardParsing (parsing state).

**Concern (mic-gesture copy):** The manifest specifies `HOLD TO TALK` as the OnboardAsk mic CTA and `RELEASE TO STOP` as the OnboardRecord stop CTA, both labeled "Existing pattern." Neither is existing — the current components are tap-to-start-then-tap-to-stop, not press-and-hold. Writing these strings onto the components would lie about the interaction model. Deferred from R5b-3 (copy-only refresh) to R5b-3c, which will resolve as a paired decision: either add press-and-hold interaction (structural — wires a pointerdown/pointerup handler, replaces the current tap-toggle in OnboardAsk/OnboardRecord), or rewrite both manifest entries to reflect tap-to-stop semantics.

**Concern (Parsing rationale):** The manifest row for OnboardParsing says `Thinking…` with rationale "Kept from R5a. Short is right." The actual R5a component renders `// EXTRACTING PROJECTS + TASKS`. The string contract (`Thinking…`) ships in R5b-3; the rationale text is stale. No action beyond this note.

**Fix:** R5b-3c resolves the mic-gesture decision. Parsing rationale is closed by this note.

**Schedule:** R5b-3c.

### 14. Playwright spec is stale across the R5 rewrite

**Surface:** v2/tests/onboard-flow.spec.js.

**Concern:** The spec targets the R3 three-question flow — `q1-ask`/`q2-ask`/`q3-ask` steps that no longer exist, `priority: 1` numeric field replaced by `urgent: bool`, Q1/Q2/Q3 transcript fixtures from the deleted prompt sequence. 30+ references to R3-era constructs across the file. Also contains 4 references to `onboard-error-retry` / `onboard-error-restart` test-ids that R5b-3b renamed. Patching any subset of these references would produce a file that reads current but still fails at the structural level.

**Fix:** Wholesale rewrite in R5b-8 per phase4-redesign-spec.md § Playwright Test Plan (10-test suite against the Council 2 flow).

**Schedule:** R5b-8, after the implementation prompts land and before phone test.

### 17. deleteProject store action silently drops child tasks; spec requires orphan-conversion choice

**Surface:** v2/src/state/onboard.js deleteProject() (lines ~417-441). v2/src/components/Onboard/OnboardReview.jsx delete-project × affordance (R5b-5 markup, R5b-6 wiring).

**Concern:** The existing deleteProject store action unconditionally removes the project AND all its child tasks from extracted.projects. phase4-open-items item #7 ("R5b needs fully editable Review") specifies the delete affordance must offer "drop or convert to orphans" for child tasks — i.e., the user's spoken-aloud tasks shouldn't silently vanish when a mis-grouped project gets deleted. Options: (a) window.confirm with language naming the choice, (b) inline confirmation overlay with explicit CONVERT TO ORPHANS vs DROP buttons, (c) always convert to orphans on delete with no prompt (safer default).

**Fix:** R5b-6 implements. Recommended direction: window.confirm for R5b-6 velocity, upgrade to inline overlay post-Phase-4 polish. Or simplest alternative: always convert to orphans on delete, no prompt, let the user discard orphans individually if they don't want them.

**Schedule:** R5b-6. R5b-5 ships markup of × button but does not wire it.

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

### 11. CAPTURE_QUESTION duplicated across OnboardAsk.jsx and OnboardParsing.jsx

**Surface:** v2/src/components/Onboard/OnboardAsk.jsx and v2/src/components/Onboard/OnboardParsing.jsx both declare `const CAPTURE_QUESTION = "What's active right now?"` as file-local literals.

**Concern:** Future copy changes to the capture question will need to be applied in both files or the Parsing screen will echo a stale prompt. Low-severity drift risk.

**Fix:** Extract to a shared constants module (e.g. v2/src/components/Onboard/onboardStrings.js) and import from both. Minor refactor.

**Schedule:** Polish pass. Non-blocking for Phase 4 ship.

### 12. `error.recoverable` field is now redundant with `error.variant`

**Surface:** v2/src/state/onboard.js error object shape.

**Concern:** After R5b-3b introduces `variant`, every known variant is recoverable. The `recoverable` field is preserved for backwards compatibility and defensive handling of a hypothetical future 'fatal' variant, but currently adds noise. Candidate for removal in a later cleanup sweep, along with simplification of any render checks that still read it.

**Schedule:** Polish pass post-Phase-4.

### 13. Mic-permission-denied misclassified as transcription failure

**Surface:** v2/src/components/Onboard/OnboardRecord.jsx getUserMedia / recorder startup errors (lines 65, 107) classified as `variant: 'transcription'` in R5b-3b.

**Concern:** Transcription copy ("Didn't catch that. Try again?") is misleading when the actual failure is mic permission denied or device unavailable. "Try again" loops the user — they need to change iOS permissions, not retry. A dedicated `'mic-unavailable'` variant with copy like "Can't hear you. Check your mic permissions." and ideally a link to iOS settings would fix this.

**Schedule:** Polish pass post-Phase-4, or whenever this surfaces in dogfooding.

### 15. Spec wording: registry source for OrphanPicker

**Surface:** vault/build/phase4-flow-redesign.md § "Review UX architecture" § "Orphan picker" — "Existing vault projects — scrollable list of vault registry projects."

**Concern:** Spec handwaves the fetch path as "the same registry source used by extraction," which is technically wrong — extraction's registry is fetched server-side by api/chief.js. Frontend has boardStore.summary, which is the equivalent but distinct data path. OrphanPicker reuses boardStore per R5b-4; spec wording should be updated to name the store directly.

**Schedule:** Spec refresh post-Phase-4 close. Non-blocking.

### 16. Spec update: OrphanPicker deviations for R5b-4 landing

**Surface:** vault/build/phase4-flow-redesign.md § "Review UX architecture" § "Orphan picker".

**Concern:** R5b-4's implementation deviates from the manifest in two user-visible ways that should be reflected in the spec when next refreshed:
(1) Suggested-name row AND free-form input row coexist when orphan.suggestedProjectName is present. Manifest implies mutual exclusion ("otherwise"). Coexistence is strictly better UX.
(2) Orphan text reminder rendered as subhead under "Where does this go?" title. Manifest has no entry for this; added because users picking across multiple orphans need visible reminder of which task they're assigning.

**Schedule:** Spec refresh post-Phase-4 close. Non-blocking.

### 18. "● MATCH" badge copy is Claude-authored, not in copy manifest

**Surface:** v2/src/components/Onboard/OnboardReview.jsx match-row rendering.

**Concern:** R5b-5 renders a `<span class="match-badge">● MATCH</span>` element to anchor the match-row visually. The badge copy comes from the mockup, not the R5b-5 copy manifest in phase4-flow-redesign.md. The badge is useful for wayfinding (it explains what the row is before the user parses the toggle), but post-phase spec refresh should either: (a) add the badge to the manifest, or (b) confirm it's OK as visual decoration and note it's mockup-sourced.

**Schedule:** Spec refresh post-Phase-4.

### 19. R5b-5 commit bypassed pre-commit byte-accurate review

**Surface:** v2/src/components/Onboard/OnboardReview.jsx, OnboardReview.css, and tokens.css at commit cf18a75.

**Concern:** The R5b-5 commit was landed with partial pre-commit review. The "retype file content into chat" review protocol drifted on multi-hundred-line files, and the advisor's tools cannot fetch arbitrary raw GitHub URLs to verify the committed bytes. Three specific paste-vs-disk discrepancies were flagged during the R5b-5 review cycle that could not be resolved: (1) OnboardReview.css line 325 indentation, (2) line 326 renumbering artifact, (3) lines 548-549 possible duplicate property declarations. All three may be paste-retyping artifacts rather than disk defects; none would cause build failure even if they were real. Risk is limited to minor CSS edge cases.

**Fix:** R5b-6 will modify the same files for interaction wiring. If any of the three flagged locations have real defects, R5b-6 review will surface them via grep or diff noise. If R5b-9 phone test reveals a visual defect in the Review surface that traces to a CSS issue, fix in a follow-up commit.

**Schedule:** R5b-6 reviews these surfaces naturally. No standalone action.

### 20. Board has no manual-entry affordance for onboarding

**Surface:** v2/src/components/Board/Board.jsx and the empty-state CTA path.

**Concern:** App.jsx line 12 comment claims "Manual entry from Board's '+ NEW PROJECT' button (and the empty state CTA) is wired in Board.jsx via openOnboard" — but this wiring does not exist. The only paths into onboarding are (a) auto-open on empty registry via useAutoOnboard, and (b) the dev/test `?force-onboard=1` query-param override. Once a user has onboarded once and the vault is populated, there is no in-app way to onboard a new batch of projects from voice capture.

**Status:** Discovered during R5b-8b test wiring. The dev override is sufficient for testing the merge/orphan paths against POPULATED_REGISTRY. Production gap remains.

**Fix:** Phase 5 work (Board interactions). Wire openOnboard to a Board affordance — most likely the "+ NEW PROJECT" button or a hamburger-menu item. Update the App.jsx comment when wiring lands.

**Schedule:** Phase 5a or 5b.

### 21. Match-toggle button label is the toggle target, not the current intent

**Surface:** v2/src/components/Onboard/OnboardReview.jsx match-row toggle button (lines ~256-275).

**Concern:** From undecided state (low-confidence match, matches[tempId] === undefined), the match-row displays "DECIDE: MERGE OR CREATE" with a button labeled "CREATE NEW". Tapping "CREATE NEW" calls `setMatchDecision(p.tempId, !(undefined === true))` which evaluates to `setMatchDecision(p.tempId, true)` — flipping state to merge:TRUE. The button label was the toggle target ("clicking will go to CREATE NEW") but in undecided state there is no current state to toggle from, so the label promises one outcome and the click delivers the opposite. Reaching actual merge:false (CREATE NEW) requires TWO taps from undecided.

**Discovered:** R5b-8b test 9 (low-confidence match). Test comments the behavior. Logged here so phone test catches whether it's confusing in practice.

**Fix options:**
- (a) Re-label undecided state's button to "CREATE NEW" but make a single click flip directly to merge:false (treat undecided as if it were merge:true for toggle purposes).
- (b) Render two distinct buttons in undecided state: "MERGE" and "CREATE NEW", each setting state directly.
- (c) Leave as-is and accept the two-tap UX as the cost of a single-button toggle.

**Schedule:** Phase 8 polish unless phone test (R5b-9b) finds it actively confusing — then promote to a Phase 5 fix.

## RESOLVED — Fixed during rebuild

### 10. OnboardError variant routing not yet wired

Resolved in commits d439c46 (state store + call-site migration) and 582a784 (component variant resolver).

**Surface:** v2/src/components/Onboard/OnboardError.jsx.

**Concern:** Current OnboardError renders one generic message + fixed button labels. The copy manifest (phase4-flow-redesign.md) specifies three distinct error variants keyed by `error.step` origin: transcription-failed (TRY AGAIN → returns to capture-ask), empty-extraction (TAKE ANOTHER PASS → returns to intro), partial-commit (RETRY ▶ with N-failed interpolation → returns to review). Variant routing is new logic — out of scope for the copy-only R5b-3 pass. Implementation needs: a marker on the error object distinguishing empty-extraction from generic parsing failure (probably a flag set by setError or receiveExtraction), a variant resolver in OnboardError, and access to commitProgress.failed.length for the partial-commit interpolation.

**Fix:** R5b-3b dedicated prompt before R5b-4 (OrphanPicker) lands, so error paths are real by the time Review stress-tests them.

**Schedule:** R5b-3b, immediately after R5b-3.

### R6. Schema gap between R3 and R2 backend (resolved in R2.5)

R3 commits tasks with `urgent` + `order` fields. Original R2 op:add didn't accept these. R2.5 extended op:add with both fields. Resolved.

### R7. receiveExtraction signature mismatch (resolved in R5a)

OnboardParsing.jsx called `receiveExtraction(projects)` with old signature. R5a rewrote to pass full payload `{projects, orphan_tasks, clarification_needed}`. Resolved.

### R9. Slug invention bug in onboard extraction (resolved in 229e65c)

Opus was inventing `matched_existing_id` slugs (e.g. `pallister` for the existing `708-pallister`) because `chief.js` op:onboard sent only project names in the registry tail, not ids. Tasks under "merged" projects then 404'd at `/api/backlog`. Fix: `chief.js` registry tail now emits structured `- id: "..." · name: "..." · aliases: ...` lines; schema description for `matched_existing_id` and `vault/systems/onboard-system.md` example both updated to require an EXACT id from the list. Resolved.

### R10. Parallel-write race in api/project.js (resolved in 899c02d)

`op:add` used `Promise.all` to write `_registry.json` and the new `backlog.json` in parallel. Both PUTs target the same GitHub ref; trees were computed independently and GitHub silently dropped one of the two commits. Phone test surfaced 3 stale registry entries (`personal`, `financial`, `motor-city-deals-command-center`) whose backlog files never landed even though both PUTs reported 200. Fix: serialize — backlog first, registry second, registry only writes if backlog landed. Resolved.

### Stale registry entries cleanup (resolved in eb246a1 on main)

Three orphan registry entries from broken parallel-write test runs (`personal`, `financial`, `motor-city-deals-command-center`) had no backing `backlog.json` files and were not real projects. Deleted from `_registry.json` directly on `main`. Recreatable via onboarding if the user actually wants any of them. Resolved.

### R8. Onboard.jsx done-state teardown (resolved in R5a)

After successful commit, `step === 'done'` needed something to call `closeOnboard`. R5a's OnboardReview placeholder wires a 1-second-delay `useEffect` for this. Real OnboardReview in R5b will carry forward the same pattern.

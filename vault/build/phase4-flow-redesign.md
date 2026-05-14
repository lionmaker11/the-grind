# Phase 4 Flow Redesign — Council 2 Deliberation Output

State machine identical to the one already implemented in R3. No new states, no new edges. The `clarify-ask → review` skip edge, the parsing → error edge on empty extraction, and the committing → error edge on partial failure all retained. See `v2/src/state/onboard.js` STEPS and VALID_EDGES.

## Copy manifest

Every string in the onboarding flow. All copy below supersedes whatever currently lives in the referenced component.

| Surface | State | String | Rationale |
|---|---|---|---|
| OnboardIntro | intro (heading) | `Dump what's on your plate.` | Kept from R5a. Voice is right. |
| OnboardIntro | intro (body) | `Out loud. Take your time. A couple minutes, not ten seconds.` | Adds expectation-setting. Users who think onboarding is fast bail when it isn't. |
| OnboardIntro | intro (button) | `START ▶` | Kept. Minimal. |
| OnboardAsk | capture-ask (prompt) | `What's active right now?` | Shorter, more conversational. Opens wider — doesn't presuppose "project" language. |
| OnboardAsk | capture-ask (subtext) | `// Jump around. Name projects when you switch.` | Light cue, not a rule. Robust orphan fallback handles users who ignore it. See Dissent #2. |
| OnboardAsk | capture-ask (mic CTA) | `HOLD TO TALK` | Existing pattern. |
| OnboardRecord | capture-record (footer label) | `CAPTURE · RECORDING` | Existing pattern (see phase4-redesign-spec). |
| OnboardRecord | capture-record (stop CTA) | `RELEASE TO STOP` | Existing pattern. |
| OnboardRecord | capture-record (cancel) | `✕ CANCEL` | Existing. Existing `cancelRecording()` store action. |
| OnboardClarify | clarify-ask (prompt) | *(Opus-generated per transcript)* | Existing pattern. Example in system prompt: "You mentioned Rick and Pallister — one project or two?" |
| OnboardClarify | clarify-ask (skip button) | `SKIP — I'LL FIX IN REVIEW` | Clarified copy tells user what's skipped-to. |
| OnboardClarify | clarify-record (footer label) | `CLARIFY · RECORDING` | Existing pattern. |
| OnboardParsing | parsing | `Thinking…` | Kept from R5a. Short is right. |
| OnboardReview | review (heading, collapsed) | `Here's what I got.` | Sets the frame: this is interpretation, not truth. User confirms. |
| OnboardReview | review (subheading, collapsed) | `Check the projects first. Tap to open.` | Explicit order-of-operations cue. Directs attention to project-level before task-level. |
| OnboardReview | review (project row, MATCH toggle label) | `MERGE WITH EXISTING` / `CREATE NEW` | Clearer than MATCH badge alone. User sees the decision, not a status. |
| OnboardReview | review (project row, urgent count) | `N URGENT / M TOTAL` | Per simplification spec. Amber on N when N > 0; dim-mono on M. |
| OnboardReview | review (project row, expand chevron a11y) | `Expand [project name]` / `Collapse [project name]` | Screen reader label. Visible glyph `▸` / `▾`. |
| OnboardReview | review (inline task edit placeholder) | `Add a task…` | Prompts the + affordance. |
| OnboardReview | review (add project button) | `+ NEW PROJECT` | Existing pattern. |
| OnboardReview | review (orphan section header) | `Didn't belong anywhere obvious.` | Human framing. Not "orphans" — nobody thinks in that word. |
| OnboardReview | review (orphan assign CTA) | `ASSIGN →` | Short, action-first. |
| OnboardReview | review (orphan picker title) | `Where does this go?` | Frames the user's decision as a question, not a menu. |
| OnboardReview | review (orphan picker options) | Existing vault projects · Extracted projects · `+ NEW: [suggested name]` · `DISCARD` | See UX architecture §3. |
| OnboardReview | review (LOCK IT IN) | `LOCK IT IN ▶` | Existing pattern. Canonical. |
| OnboardReview | review (LOCK IT IN disabled tooltip/state) | *(visually: button dimmed; no copy shown — disabled state speaks for itself)* | No disabled-reason copy; the unresolved items (unassigned orphans, unnamed projects, pending match decisions) already have their own visual state on-screen. |
| OnboardCommitting | committing | `LOCKING IN · N / M` | Existing placeholder pattern. |
| OnboardDone | done | `Locked.` | Terser than anything else. Feels like a closed door. |
| OnboardError | error (transcription failed) | `Didn't catch that. Try again?` | Conversational. Not "error 500." Button: `TRY AGAIN` |
| OnboardError | error (empty extraction) | `Couldn't pull anything out of that. Want to take another pass?` | Admits failure in the system's voice, not the user's. Button: `TAKE ANOTHER PASS` — routes to intro. |
| OnboardError | error (partial commit) | `N didn't save. Retry just those?` | Specific. Matches the selective-retry mechanic. Button: `RETRY ▶` |
| OnboardExitConfirm | (overlay) | `Bail out? You'll lose what you said.` | Honest. Exit destroys in-flight state. |
| OnboardExitConfirm | (overlay buttons) | `BAIL` / `KEEP GOING` | Direct. |

## Component requirements

### Rewrite wholesale

**`v2/src/components/Onboard/OnboardReview.jsx`** — replaces the R5a placeholder. Full scope below. Apply `unmountedRef` guard pattern per open item #3.

### Refresh copy only (no logic change)

- `v2/src/components/Onboard/OnboardIntro.jsx` — strings per manifest.
- `v2/src/components/Onboard/OnboardAsk.jsx` — capture-ask prompt + subtext per manifest.
- `v2/src/components/Onboard/OnboardRecord.jsx` — string pass; verify footer label pattern.
- `v2/src/components/Onboard/OnboardClarify.jsx` — skip button copy.
- `v2/src/components/Onboard/OnboardParsing.jsx` — no change (already `Thinking…`).
- `v2/src/components/Onboard/OnboardFooter.jsx` — verify labels match manifest.
- `v2/src/components/Onboard/OnboardError.jsx` — error copy per manifest; wire copy variant per `error.step` origin.
- `v2/src/components/Onboard/OnboardExitConfirm.jsx` — strings per manifest.

### Unchanged

- `v2/src/components/Onboard/Onboard.jsx` — root switcher.
- `v2/src/components/Onboard/OnboardMessage.jsx` — shared bubble, no change.
- `v2/src/state/onboard.js` — no state machine delta. Existing actions cover everything Review needs.

### Possibly needed

- **`v2/src/components/Onboard/OrphanPicker.jsx`** (new) — sheet/modal for orphan assignment. Lists existing vault projects (fetched from the same registry source used by extraction), extracted projects (from `onboardStore.extracted.projects`), `+ NEW: [suggested name]` with pre-fill from `suggestedProjectName`, and `DISCARD`. On selection, calls `assignOrphan(orphanTempId, assignment)` and dismisses. Tagged-union `assignment` shape already defined in onboard.js `assignOrphan` — see existing doc comment there.

### Shared utilities

- Drag utility (`v2/src/lib/drag.js`) — keep watching open item #4. If project panels inside a single draggable list have heterogeneous heights, upgrade drag.js to cursor-Y-vs-per-row-midpoint with snapshot rects at drag-start. Decide during Review CSS layout — if task rows are uniform height within each project panel and project panels are a separate list, current drag.js is fine.

## State machine delta

**None.** The existing STEPS array and VALID_EDGES map in `v2/src/state/onboard.js` cover the Council 2 flow without modification.

The *behavioral* change — project-collapsed mode by default on review — is component-internal and does not surface in the store. Expansion state is local to `OnboardReview.jsx` via `useState`. Not persisted across review sessions (a fresh review is fresh).

## Extraction prompt delta

File: `vault/systems/onboard-system.md`

Two changes. Additive to existing rules; do not remove existing text.

### 1. Conservative project binding

Add under the **Projects** section, after the existing "Match existing vault entries" rule:

> **Do not fabricate umbrella projects.** If a user mentions tasks without clearly naming a parent project (either a new project they're explicitly scoping, or an existing vault project by name/alias), route those tasks to `orphan_tasks`. Do NOT invent an umbrella like "Personal," "General," "Misc," or a category name ("Health", "Finances") to group loose tasks under. Umbrella projects are the single biggest failure mode of this flow — surfacing ambiguity in the review screen is always better than hiding it inside a fabricated parent.
>
> A project exists only when the user said its name, or when it matches an existing vault entry. Otherwise, the tasks are orphans, and the review screen handles assignment.

### 2. Stronger orphan bias

Update the **Orphan tasks** section header paragraph:

> Orphans are a feature, not a fallback. Prefer orphans over forced attachment. The review screen is designed to handle them gracefully — each orphan gets a picker for assignment to an existing project, an extracted project, a new ad-hoc project, or deletion. A large orphan set is not a failure; it's the correct output when the user's speech was unstructured.
>
> When proposing `suggested_new_project_name` for an orphan, be modest: suggest only when there's a clear signal (e.g., the user named a domain in the transcript that isn't yet a project). Omit the suggestion when uncertain — the user can create an ad-hoc project at review time.

### 3. Update the example

The existing worked example at the end of `onboard-system.md` shows an "Annual Physical" project with `matched_existing_id: null` — a project fabricated from a single task ("Book annual physical") based on a health context. Under the new conservative rule, this should become an orphan with `suggested_new_project_name: "Annual Physical"` — not a standalone project. Update the example so the teaching matches the rule.

### Not changed

- Existing-registry injection in `api/chief.js` op:onboard (already landed, slug-invention fixed in 229e65c).
- Tool schema (extract_onboarding) — no field changes.
- Clarification trigger logic — retained as-is.
- Urgent flag extraction rules — retained as-is.

## Review UX architecture

### Default render — project-collapsed mode

On entering `step === 'review'`, the component renders:

1. **Header band.** `Here's what I got.` on one line, `Check the projects first. Tap to open.` on the next, both left-aligned.
2. **Project list.** One row per project. Each row shows:
   - Project name (editable inline; tap to edit)
   - MATCH toggle (if `matched_existing_id` present) — two-state pill: `MERGE WITH EXISTING` / `CREATE NEW`, defaults from `matches[tempId].merge` (see `initMatchesFromProjects` in onboard.js)
   - Urgent count: `N URGENT / M TOTAL` (amber N, dim-mono M)
   - Expand chevron: `▸` when collapsed, `▾` when expanded
   - Drag handle: `≡` (touch: long-press to pick up; see drag.js)
   - Delete affordance: `×` (shown only in expanded state or via row overflow — design decides; not visible in the collapsed default)
3. **Add-project button.** Below the project list: `+ NEW PROJECT`.
4. **Orphan section.** Below the add-project button:
   - Header: `Didn't belong anywhere obvious.`
   - One row per unassigned orphan: task text (editable inline) + urgent indicator + `ASSIGN →` CTA
   - Orphans that have been assigned show their assignment inline and an undo affordance (design decides visual)
5. **Sticky footer.** `LOCK IT IN ▶` button. Disabled when `isReadyToCommit()` returns false.

### Expansion

Tapping a project row (outside the chevron, name edit field, or MATCH toggle — or tapping the chevron directly) toggles its expansion. An expanded project shows:

- Task rows under the header, indented
- Each task row: task text (editable inline), urgent indicator (amber left-rail accent when urgent, long-press 500ms to toggle), drag handle, delete `×`
- `+ ADD TASK` affordance at the bottom of the task list

Multiple projects can be expanded simultaneously. Expansion state is local to the review component's lifetime.

### MATCH toggle

For each project with `matched_existing_id` set, the row shows a two-state pill:

- `MERGE WITH EXISTING` — the default when `match_confidence >= 0.7`
- `CREATE NEW` — the default when `match_confidence < 0.3`
- Undecided (neither selected) — when confidence is between 0.3 and 0.7; user must tap one before LOCK IT IN enables

Tapping the pill toggles the state via `setMatchDecision(tempId, merge)`.

### Orphan picker

Tapping `ASSIGN →` on an orphan opens a bottom sheet:

- Sheet title: `Where does this go?`
- Sections (in order):
  1. **Existing vault projects** — scrollable list of vault registry projects, showing project name
  2. **Extracted projects** — scrollable list of projects currently in `onboardStore.extracted.projects`, showing the current (possibly edited) project name
  3. **Create new** — if the orphan has a `suggestedProjectName`, shown as `+ NEW: [suggested name]`. Otherwise shown as `+ NEW PROJECT` with an inline text field for the user to type a name.
  4. **Discard** — `DISCARD` (maps to `{ kind: 'deleted' }`)

Tapping any option calls `assignOrphan(orphanTempId, assignment)` and dismisses the sheet. The orphan row in the review screen updates to show its assignment inline.

### LOCK IT IN enable logic

Existing `isReadyToCommit()` in onboard.js covers:
- All project names non-empty
- All MATCH-ambiguous projects have a decision
- All orphans assigned or deleted

No changes required. Component binds button `disabled` to `!isReadyToCommit()`.

### Error recovery within review

- **Partial commit failure** — review returns to `step === 'error'`; retry button calls `clearError()` → `startCommit()` → `commitOnboardingResults()`. Already committed items skip via existing `committed` flags. Copy per manifest.
- **No mid-flow rewind to re-record.** User's only escape hatch is the exit confirmation (`closeOnboard()` → `OnboardExitConfirm`), which destroys in-flight state. See Dissent #3.

## Failure-mode handling

### Transcription fails (Whisper error, timeout, silence)

Currently handled by the error path in voice.js and onboard.js. Route: `setError('capture-record' | 'clarify-record', message, true)` → `step === 'error'`. RETRY calls `clearError()` → returns to `capture-ask` (per ERROR_RECOVERY_STEP). No change to mechanics. Copy per manifest.

### Extraction returns empty

Currently handled: `receiveExtraction` detects empty projects + empty orphans, transitions to error with `message: 'No projects detected. Try again?'`. Override the copy to `Couldn't pull anything out of that. Want to take another pass?`. RETRY routes to intro (not capture-ask) — the user may want to reconsider approach, not immediately re-record. `clearError()` already handles this special case via the `noExtracted` branch.

### Extraction returns wrong structure

No special error path. The review screen's collapse-mode default is the primary defense: user evaluates project-level structure before drilling into tasks. If a project is wrong (wrong tasks grouped, wrong name, fabricated umbrella), user renames, deletes, splits tasks to other projects, or discards and uses `+ NEW PROJECT`. Powerful review is the mitigation for extraction imperfection.

### User misspeaks mid-capture

No mid-recording edit. User cancels via `cancelRecording()` (existing `✕ CANCEL` affordance), returns to `capture-ask`, re-records. Production voice UIs uniformly follow this pattern — redo, not revise.

### User gets interrupted (phone call, etc.)

Recording cancels on app background or tab switch (existing voice.js behavior). On return, user lands on whatever step was last reached. No resume-mid-recording. Users accept redo; half-recording resume is worse than a clean restart.

### Mid-commit partial failure

Existing selective-retry mechanic retained. `commitProgress.failed` populates; `finishCommit()` routes to error with message `${n} items failed to commit. Retry?`. Override copy to `${n} didn't save. Retry just those?` per manifest. RETRY calls `clearError()` → `startCommit()` → `commitOnboardingResults()`. Already-committed items skip.

**Related open item #1** — merge-append bug in commit orchestrator Pass 3. Not a failure mode users will see directly, but a correctness issue for merged projects that must be fixed before R5b ships or as part of R5b. See `phase4-open-items.md`.

### User wants to rewind from review to re-record

Not supported. User's escape is the exit confirmation. See Dissent #3.

## Behavioral rationale

### Why one capture turn, not multiple

Kahneman: recall is expensive. Asking "what are your projects?" forces the user to generate a complete list from nothing, which produces incomplete output with high confidence. Asking "what's active right now?" is low-precision but captures content breadth. The *recognition* step happens on the review screen, where the user edits a machine-produced list — a much cheaper cognitive task.

Fogg: every additional voice turn is a bail point. At current flow depth (intro → capture → optional clarify → review → done), the cost is tolerable. Adding per-project turns pushes completion rate off a cliff.

Allen dissent: a true capture is one question, all organization on the machine side. Accepted in principle; constrained by current LLM extraction quality. Revisit when models improve.

### Why project-collapsed review

Kahneman: the review screen asks many questions at once (project names, MATCH decisions, task text, urgent flags, orphan assignments, reordering). Mixing levels of attention is how errors hide. Project-collapsed mode forces the user's first attention to the project-level structure. Task-level editing is deferred until the user explicitly expands a project — a signal that they've already validated the parent.

Pearl: the review surface is where the user edits interpretation. Making interpretation the first thing visible, in its simplest form, matches the voice-UI pattern of "system shows what it understood, user confirms."

Lütke dissent: a single unified surface has lower cost. Kept overridden because the attention-ordering win is larger than the surface-count cost (no new screen; same surface, different default state).

### Why conservative extraction, not clever extraction

Singer: the user's goal is a vault that reflects reality. Silent errors (fabricated umbrellas) violate this goal more severely than visible uncertainty (orphans). Orphans surface ambiguity; umbrellas bury it. A review screen with eight orphans is a user experience; a review screen with three projects that contain mis-grouped tasks is a silent lie.

Lütke: better to surface uncertainty than to hide it in a wrong answer. Aligns with the existing frozen-API discipline — prefer explicit review over assumed correctness.

### Why powerful review, not guided review

Hall: telling the user how to use the system is the worst kind of interface. Guided review (wizards, step-by-step confirmations) is a form of telling. Powerful review gives the user every edit affordance at once and trusts them to find what they need. The collapse-mode default provides light guidance on *where to start*; from there, the user is in control.

### Why no mid-review rewind to capture

State machine simplicity. Allowing review → capture-ask or review → intro transitions while preserving/discarding extracted data introduces several edge cases (what happens to orphan assignments, match decisions, inline edits?). The clean escape is exit-and-restart. If the review screen is truly too broken to recover from, full restart is a clear mental model; a partial rewind is not.

Hall dissent: would prefer a review → re-record affordance. Flagged for revisit if dogfooding reveals the "review is hopeless" case in practice.

## Dissents and open questions

### Council dissents on record

1. **Allen — capture purity.** Prefers single pure-dump capture with all organization machine-side. Accepted as the ideal end state; deferred to future model capability.
2. **Hall — strip the capture subtext.** Would remove `// Jump around. Name projects when you switch.` as making the user serve the system. Majority kept on the grounds that a light cue helps the median case and the orphan fallback catches users who ignore it.
3. **Hall — mid-review rewind to capture.** Wanted a re-record affordance from review. Majority rejected on state-machine complexity grounds. Flag for dogfooding revisit.
4. **Lütke — single unified review surface.** Preferred no collapsed mode. Overridden on attention-ordering grounds.
5. **Forte — areas vs. projects as separate data model classes.** Deferred to Phase 9+ scope.

### Open questions — resolved by T.J. prior to R5b

1. **Review is tap-only, not voice.** Confirmed. Voice-in-review is Phase 5+ scope.
2. **Orphan UI scale.** One-at-a-time picker pattern for R5b. Batch-assign is a dogfooding decision.
3. **Capture subtext (Dissent #2).** Keep as-written. If it reads wrong on phone test, stripping it is a one-line change.
4. **Mid-review rewind (Dissent #3).** Not built. Exit-and-restart is the escape.
5. **Extraction prompt edit.** Proceed. Prompt file, not `/api/*` — no new exception. Diff review still applies.
6. **Merge-append bug fix (open item #1).** Option B: backend `order: 'append'` sentinel in `api/backlog.js`. Falls inside existing op-routing scope.

## Implementation sequence (proposed for R5b)

Once this spec is approved and committed, R5b proceeds one prompt at a time with review gates between each:

1. Update `vault/systems/onboard-system.md` — conservative binding rule, orphan bias rule, example update.
2. Extend `api/backlog.js` op:add with `order: 'append'` sentinel.
3. Copy refresh pass across existing non-review onboarding components.
4. Build new `OrphanPicker.jsx` component (unwired).
5. Rewrite `OnboardReview.jsx` structure + render (non-interactive).
6. Wire all interactions in OnboardReview + hookup `order: 'append'` in `commitOnboardingResults` Pass 3 for merged projects.
7. Evaluate drag utility against actual Review layout; upgrade if needed.
8. Rewrite Playwright E2E tests per the test plan in `phase4-redesign-spec.md`.
9. Pre-merge status report.
10. T.J. phone test.

## What happens to prior Phase 4 commits

Unchanged from `phase4-redesign-spec.md` — archaeology preserved on the branch. No force-push, no history rewrite. The Council 2 rebuild lands as additional commits on top of `9c568ad`; the eventual merge commit subsumes the whole branch into main.

## Approvals and context

- Council 2 (Onboarding Flow Redesign, 22 April 2026): Erika Hall, Kate Kiefer Lee (persona), Ryan Singer, David Allen, Tiago Forte, Daniel Kahneman (persona), BJ Fogg, Cathy Pearl, Production voice conversation designer (persona), Tobi Lütke. Council output: single capture + optional clarify + project-collapsed review + conservative extraction, with dissents logged.
- Council 1 (Redesign, 21 April 2026, per `phase4-redesign-spec.md`) continues to govern data model, backend scope, test plan, and commit mechanics.
- Opus 4.7 remains the model for onboarding extraction (`mode=onboard` in chief.js routing).

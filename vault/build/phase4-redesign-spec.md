# Phase 4 Onboarding — Redesign Spec

**Status:** Current v2-phase4 branch onboarding implementation deprecated after phone test. Redesigned flow per design council 22 April 2026. Rebuild on same branch, pending Claude Design revision batch and doc-commit sequence.

**Branch:** v2-phase4 (continues)
**Supersedes:** Commits 5448a95, 05ceba8, 285b1c9, c928abf (components + tests against the old flow)
**Preserves:** Commits f4fc3ba (plan), c95156a (chief.js onboard mode), 2915d1c (nanostore — partial, schema changes pending)

## Why this redesign

Phone test of original 3-question flow surfaced four real problems:

1. **Q2 "What's on fire" produced weak answers.** Most users don't have fires. Forces invented urgency.
2. **Q3 "Close one thing this week" didn't move the needle.** Commitment is a Focus-surface concern, not onboarding.
3. **Project-task coupling broke.** Q1 elicited projects, Q2/Q3 elicited tasks without re-linking. Tasks came out floating and Opus guessed attachment.
4. **Duplicate projects on re-onboarding.** Opus created new "708 Pallister" instead of merging with existing vault entry. Root-caused to slug collisions between Opus-extracted names and existing registry IDs — `api/project.js` correctly returned 409 on every collision. 4× POST `/api/project` → 409 cascade → "6 items failed to commit" displayed.

## New flow (council output, 22 April 2026)

One capture question, optional clarify, extended review with match handling and binary urgent flag.

### States (reduced from 13 to 9)

```
idle → intro → capture-ask → capture-record → clarify-ask → clarify-record → parsing → review → committing → done
                                          ↓                                                ↓
                                     (skip clarify)                                     error
```

Valid transitions: idle → intro, intro → capture-ask, capture-ask ↔ capture-record, capture-record → clarify-ask (if needed) OR parsing, clarify-ask ↔ clarify-record, clarify-record → parsing, clarify-ask → parsing (skip), parsing → review, parsing → error, review → committing, committing → done OR error.

### Questions

**Capture (required):**
- Question: "Walk me through what's active. Every project, what's happening."
- Sub-text: "// Work, personal, health, anything."
- Expected answer: 45-120 seconds of free-form voice.

**Clarify (conditional, capped at 1 turn):**
- Only triggered if initial extraction has `orphan_tasks.length > 0` OR any project has `match_confidence < 0.5`
- Question: Opus-generated based on ambiguity. Example: "You mentioned Rick and Pallister — is Rick a separate project, or tasks within Pallister?"
- Skippable via SKIP button
- Expected answer: 5-15 seconds

### Intro copy change

- Old: "Three questions. Answer out loud."
- New: "Dump what's on your plate. Out loud. Take your time."

## Data model changes (NEW scope additions)

### Task schema

Removing `priority: 1-5`. Replaced with two fields:

```
task: {
  id: string,
  text: string,
  urgent: boolean,           // NEW — binary flag
  order: integer,            // NEW — user-dragged position within sort group
  estimated_pomodoros: int,  // existing
  category: string,          // existing
  ...
}
```

Sort order: `ORDER BY urgent DESC, order ASC`. Urgent tasks first; within each group, user-dragged order.

### Rationale for removing `priority: 1-5`

Solo operator workflow. Three-to-five priority levels forces fake distinctions — users can't honestly articulate the difference between P2 and P3. Binary urgent captures the real mental model: a task is either on fire or in the steady-grind backlog. Gradients in between are decoration without affordance.

### Backend change required

`/api/backlog.js` gets new op: `toggle_urgent`. Same endpoint, new op — no new `/api/*` exception (op added within existing routing, covered by Phase 1 endpoint scope).

Existing `add` op's payload drops `priority` integer and adds `urgent: boolean` + `order: integer` (or lets backend auto-assign `order` as `max(existing orders) + 1` for non-urgent adds).

## Extraction prompt updates

File: `vault/systems/onboard-system.md`

### New rules

- **Existing registry awareness.** Prompt assembly injects list of user's existing project names: "Existing projects in T.J.'s vault: [list]. If he mentions any of these or a clear alias, match rather than create."
- **Coupled extraction.** "Items mentioned within a project description attach as tasks to that project. Don't separate projects from tasks across extraction turns."
- **Orphan task handling.** "If an item doesn't clearly belong to a project, include it in the `orphan_tasks` array. Do not force-attach."
- **Match confidence.** "For each project, assess match to an existing registry project: `match_confidence: 0.0–1.0` and `matched_existing_id` if high confidence."
- **Urgent flag extraction.** "For each task, set `urgent: true` if the user's language contains urgency cues: 'on fire', 'overdue', 'urgent', 'ASAP', 'right now', 'this week is tight', 'can't wait', explicit overdue dates, or strong emotional framing ('freaking out about', 'need this done yesterday'). Default: `urgent: false`. Be conservative — false negatives are recoverable, false positives erode meaning."
- **Clarification triggering.** "If there are orphan tasks OR projects with confidence 0.3–0.7, you may be asked a single follow-up question to resolve. Write the follow-up concisely if prompted."

### Output schema changes

Add to existing `extract_onboarding` tool:
- Per-project: `match_confidence: number`, `matched_existing_id: string | null`
- Per-task: `urgent: boolean`
- New top-level: `orphan_tasks: [{text, urgent, category, suggested_new_project_name?}]`
- New top-level: `clarification_needed: {question: string} | null` — Opus proposes the clarification question itself if needed

Remove from schema:
- Per-task `priority: 1-5` (replaced by `urgent` binary)

## Frontend changes

### State store (`v2/src/state/onboard.js`)

Rewrite to new state machine. Preserve action patterns from current implementation but update state names and transitions. Invalid transitions remain no-ops.

Key new state:
- `matches: [{extracted_idx, existing_id, merge: boolean}]` — user-confirmed merge decisions
- `orphanAssignments: {orphan_idx: 'existing_id' | 'new_project_idx' | 'deleted'}`

### Components to REBUILD

Wholesale replacement:
- `OnboardAsk.jsx` — now handles capture-ask state only (was Q1/Q2/Q3)
- `OnboardRecord.jsx` — now handles capture-record state only
- `OnboardClarify.jsx` (NEW) — handles clarify-ask + clarify-record states
- `OnboardReview.jsx` — extended with match indicators, orphan section, drag-to-reorder, long-press-urgent
- `OnboardFooter.jsx` — new label set (CAPTURE · MIC ARMED, CAPTURE · RECORDING, CLARIFY, PARSING, REVIEW)

### Components to PRESERVE

- `Onboard.jsx` — root component, switches rendered child based on step
- `OnboardIntro.jsx` — trivial copy update
- `OnboardParsing.jsx` — minor header text update
- `OnboardError.jsx` — unchanged
- `OnboardExitConfirm.jsx` — unchanged
- `OnboardMessage.jsx` — shared bubble component, unchanged

### New shared components

- Drag-to-reorder hook or utility (reused in Phase 5b Backlog detail). iOS Safari compatible, vanilla JS + CSS, no libraries per stack lock. Press-and-hold drag handle, vertical translate, list resort on release.
- Long-press-urgent handler. 500ms hold on task row or drag handle toggles `urgent` flag. Amber pulse confirms.

### LOCK IT IN logic changes (`commitOnboardingResults`)

Existing sequential-commit with selective-retry logic stays. Additions:
- Before creating projects: check `matches` — if match + merge is true, skip project creation, add tasks to `matched_existing_id` via `/api/backlog` op:add with existing `project_id`
- After project creation: handle orphan tasks per `orphanAssignments` dict
- Per-task commit includes `urgent` boolean

### Visual treatment

- **P1/P2/P3 badges removed** from all task rows app-wide
- **Due-date/overdue meta chips removed** from all task rows app-wide (feature deferred to later phase)
- **Amber left-edge accent bar** on urgent task rows (iOS-style, ~3px wide, warning-family color)
- **Urgent count in project head** — "3 URGENT / 8 TOTAL" in amber + dim-mono total
- **Drag handle glyph** (≡) visible per task row signals draggability

### Removed from scope

- Q1-ask / Q1-record / Q2-ask / Q2-record / Q3-ask / Q3-record state names (consolidated)
- Per-task up/down priority arrows (removed entirely)
- P-badge tap-to-cycle mechanic (removed entirely)
- Priority 1-5 granularity (replaced by binary urgent)

## Design dependencies

Revised mockups required before rebuild kicks off. Claude Design revision batch pending (as of this writing):
- `40-onboard-review.html` revised — P-badges out, chips out, drag handles in, urgent gesture/visual, count in project head, drag instruction eyebrow
- `01`, `22`, `34`, `35` Board mockups revised — same simplification treatment
- `23-backlog-detail.html` revised — Phase 5b surface with drag-to-reorder primary mechanism and urgent flag
- `24`, `33` — minor revisions to reflect new task row layout

Files 36-41 (capture-ask, capture-record, clarify-ask, parsing, review frame, intro v2) already delivered from the prior design pass and do not need urgent-flag visual adjustments on non-review screens.

## Bug fixes absorbed by rebuild

Since rebuild replaces the flow wholesale, two bugs from phone test resolve as side effects of the rewrite:

1. **Duplicate project creation** — fixed via existing-registry awareness in extraction prompt + user-controlled merge on review
2. **Mic permission re-prompt per recording** — audit voice.js during rebuild. If `getUserMedia()` is called fresh per question in current code, refactor to reuse the stream across capture + clarify phases (or verify iOS Safari session-cache behavior)

## Implementation sequence

Once design mockups arrive:

1. Update `vault/systems/onboard-system.md` with new rules + schema (urgent flag + registry awareness + orphan handling)
2. Update `api/chief.js` onboard-mode to inject registry list into prompt assembly
3. Add `toggle_urgent` op to `api/backlog.js`
4. Rewrite `v2/src/state/onboard.js` state machine + new state fields (matches, orphanAssignments)
5. Build shared drag-to-reorder utility + long-press-urgent handler (reused Phase 5b)
6. Rebuild OnboardAsk, OnboardRecord, OnboardReview per new mockups
7. Build new OnboardClarify component
8. Update OnboardIntro + OnboardParsing + OnboardFooter for new labels
9. Update LOCK IT IN logic for matched-merge + orphan handling + urgent flag
10. Rewrite Playwright E2E tests (see Playwright Test Plan below)
11. Build + lint + test all green
12. Push, phone-test the new flow
13. Fix anything phone test reveals
14. Merge to main

## Playwright Test Plan

Extending the original 5-case suite with merge path coverage. Original suite (commit 285b1c9) ran against an empty-summary fixture, which masked the slug-collision failures found in phone test. Rebuild tests must run against a fixture with pre-populated projects to exercise the merge path.

### Preserved tests (update for new flow)

1. **Happy path** — intro through LOCK IT IN done, full transition chain with new 9-state machine
2. **Review edits** — rename/delete/add on review screen, commit with edited state (now includes drag-to-reorder + long-press-urgent interactions)
3. **Empty extraction** — Opus returns `{ projects: [], orphan_tasks: [] }` → error with retry and restart paths
4. **Transcription failure** — /api/transcribe 500 on capture → error then retry returns to capture-ask
5. **Partial commit** — selective retry skips already-committed projects and tasks (existing fix preserved)

### New tests

6. **Existing project detected, user confirms MERGE.** Fixture has existing "Lionmaker Systems" project. Opus returns extracted project with `matched_existing_id: "lionmaker-systems"` + `match_confidence: 0.9`. Review renders with MATCH badge, default merge on. User taps LOCK IT IN without changing. Assert: NO `/api/project add` call for matched project; `/api/backlog add` called with existing `project_id` for each task; success state.

7. **Existing project detected, user overrides to CREATE NEW.** Same fixture as test 6, but user taps CREATE NEW toggle on review. Assert: `/api/project add` IS called for a new project with unique slug suffix (e.g., "lionmaker-systems-2"); tasks attach to new project ID.

8. **Low-confidence match.** Fixture has existing "708 Pallister" project. Opus returns "Palmer" with `match_confidence: 0.4`, `matched_existing_id: "708-pallister"`. Review renders both MERGE and CREATE NEW options without a default. User picks CREATE NEW. Assert: new project created, tasks attached to it, existing project untouched.

9. **Urgent flag extraction.** Fixture: Opus returns tasks with mixed `urgent: true | false` based on language cues. Review screen renders amber accent on urgent rows, urgent count in project head. User toggles one task's urgent state via simulated long-press. Commit payload reflects updated flag.

10. **Orphan task assignment.** Opus returns orphan_tasks array. User assigns each to a project via dropdown. Commit routes orphans to their assigned project via `/api/backlog add`.

### Fixture requirements

New test fixture: `fixtures/populated-registry.json` simulating a vault with 3-5 pre-existing projects. All merge-path tests (6, 7, 8) run against this fixture. Original empty-fixture preserved for tests 1-5 where relevant.

## Open questions (flagged, not blocking)

1. **Board top-3 behavior with urgent flag.** Three models possible: (A) urgent sort to top of single backlog, top-3 is first 3; (B) top-3 shows urgent first, falls back to non-urgent; (C) Board shows urgent only, non-urgent on Backlog detail only. Decide during Phase 5a design, not Phase 4.

2. **Urgent hard cap per project.** Soft limit via visible count is starting approach. If "urgent inflation" becomes a real problem in dogfooding, consider hard cap (max 3 urgent per project) or auto-expire (urgent older than X days demotes). Revisit after dogfooding.

3. **Haptic feedback on long-press urgent toggle.** iOS Safari haptic support is inconsistent via Vibration API. Attempt best-effort via `navigator.vibrate(50)` — silently succeed or fail. No hard dependency.

## Approvals and context

- Council 1 (Onboarding Flow Redesign): David_Allen_Methodologist, Julie_Zhuo_Designer, Ryan_Singer_Scope, Tobi_Lütke_Operator, Voice_UX_Researcher. Convened 22 April 2026. All 5 approved the one-capture + optional-clarify + extended-review structure.
- Simplification decisions (P-badge removal, chip removal, urgent binary, drag-to-reorder universal): user-directed, 22 April 2026. No council needed — clear operator preference.
- Opus 4.7 remains the model for onboarding extraction (`mode=onboard` in chief.js routing).

## What happens to current Phase 4 commits

They stay on the branch as-is. When the rebuild lands and Phase 4 eventually merges to main, the merge commit subsumes them. If ever useful to reference the old flow, it's in git history.

No force-pushes. No history rewrite. Just: next commits replace the flow, existing commits remain as archaeology.

# The Grind V2 Phase 4 R5b — Codex External Review

- **Date:** 2026-05-05
- **Branch + HEAD reviewed:** `v2-phase4` at `bbf4e59`
- **E2E walkthrough method:** Playwright direct against local Vite dev server (`http://127.0.0.1:5173`) with mocked `/api/*` backend and Chromium viewport `390x844`.

## Commands Run

### `git log --oneline main..v2-phase4 | wc -l`

```text
      52
```

### `cd v2 && npm run lint`

```text

> thegrind-v2@0.0.1 lint
> eslint --ext .js,.jsx,.cjs src/

```

### `cd v2 && npm run build`

```text

> thegrind-v2@0.0.1 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 70 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.97 kB │ gzip:  0.48 kB
dist/assets/index-hDGCJxRY.css  41.98 kB │ gzip:  7.78 kB
dist/assets/index-BdHahdBS.js   66.35 kB │ gzip: 21.32 kB
✓ built in 205ms
```

### `cd v2 && npm test`

```text

> thegrind-v2@0.0.1 test
> playwright test

[WebServer] (node:27685) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 12 tests using 2 workers

(node:27688) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27687) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27688) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27687) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓   2 [chromium] › tests/onboard-flow.spec.js:107:3 › Phase 4 onboarding — R5b › 1 happy: capture → review → lock in commits every project and task (1.0s)
  ✓   1 [chromium] › tests/muse-loop.spec.js:152:1 › muse voice loop — mic tap to task on board (2.2s)
  ✓   3 [chromium] › tests/onboard-flow.spec.js:143:3 › Phase 4 onboarding — R5b › 2 review edits: rename + delete + add + long-press urgent flow to commit (1.9s)
  ✓   4 [chromium] › tests/onboard-flow.spec.js:251:3 › Phase 4 onboarding — R5b › 3 empty extraction: chief returns nothing → error, empty-extraction variant (725ms)
  ✓   5 [chromium] › tests/onboard-flow.spec.js:268:3 › Phase 4 onboarding — R5b › 4 transcribe failure on capture → error, transcription variant (732ms)
  ✓   6 [chromium] › tests/onboard-flow.spec.js:290:3 › Phase 4 onboarding — R5b › 5 partial commit: ProjC fails once, A/B committed-skipped on retry (1.1s)
  ✓   7 [chromium] › tests/onboard-flow.spec.js:330:3 › Phase 4 onboarding — R5b › 6 clarify path: first chief triggers clarify-ask, second chief resolves (954ms)
  ✓   8 [chromium] › tests/onboard-flow.spec.js:365:3 › Phase 4 onboarding — R5b › 7 merge accept: high-confidence match auto-merges, no project create, tasks attach to existing slug (835ms)
  ✓   9 [chromium] › tests/onboard-flow.spec.js:415:3 › Phase 4 onboarding — R5b › 8 merge override: user toggles to CREATE NEW + renames; new project created, existing untouched (998ms)
  ✓  10 [chromium] › tests/onboard-flow.spec.js:474:3 › Phase 4 onboarding — R5b › 9 low confidence: undecided match blocks LOCK IT IN; two toggle clicks reach CREATE NEW (1.2s)
  ✓  11 [chromium] › tests/onboard-flow.spec.js:528:3 › Phase 4 onboarding — R5b › 10 urgent: mixed urgent flags survive commit; long-press toggles one task (1.5s)
  ✓  12 [chromium] › tests/onboard-flow.spec.js:599:3 › Phase 4 onboarding — R5b › 11 orphan picker: assign to existing project routes commit via /api/backlog with that slug (881ms)

  12 passed (13.3s)
```

## E2E Walkthrough Evidence

Walkthrough command: `node v2/reviews/r5b-e2e-walkthrough.mjs`

| Item | Interaction | Evidence |
|---|---|---|
| 1 | Capture → review → LOCK IT IN happy path | Screenshot: `v2/reviews/artifacts/r5b/01-happy-review-ready.png`; DOM: `v2/reviews/artifacts/r5b/01-happy-review-ready.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/01-happy-board-after-commit.png`; Logs: `v2/reviews/artifacts/r5b/01-happy-board-after-commit.logs.txt` |
| 2 | Review edits — rename project, delete task, add task | Screenshot: `v2/reviews/artifacts/r5b/02-review-edits-applied.png`; DOM: `v2/reviews/artifacts/r5b/02-review-edits-applied.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/02-review-edits-committed.png`; Logs: `v2/reviews/artifacts/r5b/02-review-edits-committed.logs.txt` |
| 3 | Drag-to-reorder projects with mixed expand state | Screenshot: `v2/reviews/artifacts/r5b/03-project-drag-mixed-expand-state.png`; DOM: `v2/reviews/artifacts/r5b/03-project-drag-mixed-expand-state.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/03-project-drag-commit-order.png`; Logs: `v2/reviews/artifacts/r5b/03-project-drag-commit-order.logs.txt` |
| 4 | Drag-to-reorder tasks within a project | Screenshot: `v2/reviews/artifacts/r5b/04-task-drag-within-project.png`; DOM: `v2/reviews/artifacts/r5b/04-task-drag-within-project.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/04-task-drag-commit-order.png`; Logs: `v2/reviews/artifacts/r5b/04-task-drag-commit-order.logs.txt` |
| 5 | Long-press urgent toggle | Screenshot: `v2/reviews/artifacts/r5b/05-longpress-urgent-toggle.png`; DOM: `v2/reviews/artifacts/r5b/05-longpress-urgent-toggle.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/05-longpress-urgent-commit.png`; Logs: `v2/reviews/artifacts/r5b/05-longpress-urgent-commit.logs.txt` |
| 6 | Match decision toggling | Screenshot: `v2/reviews/artifacts/r5b/06-match-decisions-reviewed.png`; DOM: `v2/reviews/artifacts/r5b/06-match-decisions-reviewed.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/06-match-decisions-committed.png`; Logs: `v2/reviews/artifacts/r5b/06-match-decisions-committed.logs.txt` |
| 7 | OrphanPicker open → assign existing → commit | Screenshot: `v2/reviews/artifacts/r5b/07-orphan-picker-open.png`; DOM: `v2/reviews/artifacts/r5b/07-orphan-picker-open.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/07-orphan-commit-existing.png`; Logs: `v2/reviews/artifacts/r5b/07-orphan-commit-existing.logs.txt` |
| 8 | Delete project with child task → orphan conversion | Screenshot: `v2/reviews/artifacts/r5b/08-delete-project-converts-child-task-to-orphan.png`; DOM: `v2/reviews/artifacts/r5b/08-delete-project-converts-child-task-to-orphan.dom.txt`; Logs: `v2/reviews/artifacts/r5b/08-delete-project-converts-child-task-to-orphan.logs.txt` |
| 9 | Empty extraction → error state | Screenshot: `v2/reviews/artifacts/r5b/09-empty-extraction-error.png`; DOM: `v2/reviews/artifacts/r5b/09-empty-extraction-error.dom.txt`; Logs: `v2/reviews/artifacts/r5b/09-empty-extraction-error.logs.txt` |
| 10 | Partial commit → RETRY → selective retry | Screenshot: `v2/reviews/artifacts/r5b/10-partial-commit-error.png`; DOM: `v2/reviews/artifacts/r5b/10-partial-commit-error.dom.txt`; Screenshot: `v2/reviews/artifacts/r5b/10-partial-commit-selective-retry.png`; Logs: `v2/reviews/artifacts/r5b/10-partial-commit-selective-retry.logs.txt` |

## Code Review Findings

#### [POLISH-CR-1] `+ ADD PROJECT` does not enter focused name edit
- **File:** `v2/src/components/Onboard/OnboardReview.jsx:289`
- **Severity:** POLISH
- **Issue:** The phase handoff says `+ ADD PROJECT` should create an editable empty project and focus it for naming, but the click handler only calls `addProject()` and leaves `editingProjectTempId` unchanged. The new project appears as `(unnamed)` and `LOCK IT IN` is correctly blocked, but the user has to discover that tapping the placeholder name opens the editor. That is not data loss, but it is avoidable friction on the voice-review surface.

#### [POLISH-CR-2] Mock backlog failure hook reads the wrong request shape
- **File:** `v2/tests/helpers/mock-backend.js:107`
- **Severity:** POLISH
- **Issue:** `setupMockBackend()` documents that it mirrors `api/backlog.js` exactly, but its POST `/api/backlog` handler checks `body?.text`, builds the response task from `body?.text`, and echoes `body?.urgent/order` while the real client sends `{ op, project_id, task: { text, urgent, order } }`. Current tests mostly assert the captured request body, so this does not hide an existing R5b failure. It does mean `backlogAddFailOnText` will never trigger for real orchestrator requests, and any future test that relies on the mock response body could pass against a backend shape the product never returns.

## E2E Walkthrough Findings

Reviewed; no new E2E findings beyond the open items list.

## Handoff Summary

| Type | Count |
|---|---|
| Code BLOCKER | 0 |
| Code POLISH | 2 |
| Code QUESTION | 0 |
| E2E BLOCKER | 0 |
| E2E POLISH | 0 |
| E2E QUESTION | 0 |

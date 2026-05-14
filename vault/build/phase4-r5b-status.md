# Phase 4 R5b — pre-merge status (as of 2026-04-24)

## What shipped

R5b is the OnboardReview rebuild — the post-extraction surface where the user reviews Opus's project/task extraction, edits anything wrong, decides on registry-merge matches, assigns orphan tasks, and commits the batch to vault. Spans 18 commits from `ba539b5` (R5b-1, 23 April 2026) to `c09981f` (R5b-8b, 24 April 2026).

The deliverable: a fully-interactive review surface — inline edit on project names and task text, drag-to-reorder for projects and tasks, long-press to toggle urgent, ✎ to enter edit mode, × to delete, MERGE/CREATE NEW match toggle per matched project, OrphanPicker bottom-sheet for orphan assignment, LOCK IT IN orchestrator with selective retry on partial commits — wired to a new state machine governed by `vault/build/phase4-flow-redesign.md` (Council 2 output) and exercised by an 11-test Playwright suite.

R5b-9 (this status report) gates phone test. R5b-9b is the phone test itself, R5b-9c is merge to main.

## Commits in R5b

Grouped by sub-step. Ordering is chronological; sub-step letter denotes the original plan slot.

| Sub-step | Hash      | Subject |
|----------|-----------|---------|
| R5b-1    | `ba539b5` | extraction prompt conservative-binding |
| R5b-2    | `b35cd31` | api/backlog.js op:add supports `order:'append'` sentinel |
| R5b-3    | `cf6085f` | copy refresh across non-review onboarding components |
| R5b-3b   | `d439c46` | error object variant field + call-site migration |
| R5b-3b   | `582a784` | OnboardError variant routing component |
| R5b-4    | `e2c0979` | OrphanPicker component (unwired) |
| R5b-5    | `cf18a75` | OnboardReview structure + render (non-interactive) |
| R5b-6a   | `892ff9b` | simple store-action wiring (expand, match toggle, delete, add) |
| R5b-6b₁  | `23ff186` | drag wiring — project list + task lists |
| R5b-6b₂  | `15f28f2` | inline edit + long-press + orphan picker mount + orphan-conversion on delete |
| R5b-6c   | `9f0e371` | wire LOCK IT IN + `order:'append'` unification + abort guards |
| R5b-8a   | `22e665e` | Playwright E2E rewrite — 6 core tests + helpers |
| R5b-8b   | `c09981f` | Playwright E2E rewrite — 5 merge/orphan tests |

Plus open-items log entries committed alongside (`a56a877`, `cabc1aa`, `ceeb528`, `6a5fd0b`, `a863d87`, `c22ad89`, `f79a311`, `b1283a7`). R5b-7 (drag utility heterogeneous-row upgrade) was conditional on R5b-6b₁ phone-test findings; phone test deferred to R5b-9b means R5b-7 stays open as a phone-test gated item.

## Test coverage

12 Playwright tests passing in 13.5s on chromium, 2 workers.

**Onboard flow (11 tests):**
1. Happy path — capture → review → LOCK IT IN → done. Pass 2 project order + Pass 3 `order:'append'` invariant + slug grouping.
2. Review edits — rename + delete + add + long-press urgent.
3. Empty extraction → error with `empty-extraction` variant.
4. Transcribe failure → error with `transcription` variant.
5. Partial commit → selective retry (ProjC fails first attempt; A/B skipped on retry).
6. Clarify path — first chief returns `clarification_needed`, second resolves.
7. Merge accept — high-confidence (0.9) auto-decides merge:true; no `/api/project` POST; tasks attach to existing slug.
8. Merge override — user toggles to CREATE NEW + renames; new project created, existing untouched.
9. Low confidence — 0.4 leaves match undecided; LOCK IT IN gated; two toggle clicks reach CREATE NEW.
10. Urgent extraction + long-press — mixed urgent flags survive commit; long-press flips one task.
11. Orphan picker → existing project — orphan assigns to Lionmaker Systems via picker; commit posts under existing slug.

**Muse flow (1 test):** existing pre-R5b muse-loop spec — voice tap → task on board.

**Bundle size (gzipped, both under DESIGN.md budget):**
- JS: 66.35 kB raw / 21.32 kB gzipped (budget: <50 KB gz)
- CSS: 41.98 kB raw / 7.78 kB gzipped (budget: <20 KB gz)

**Not covered at E2E level:**
- Drag-to-reorder (Playwright pointermove vs `lib/drag.js` thresholds; deferred to phone test per R5b-7 conditional in open #4).
- Long-press timing on real iOS Safari (Playwright stubs the 650ms hold; real device behavior needs verification).
- Mid-commit user abort (between-pass guards added in R5b-6c, but full abort-controller wiring deferred — partial fix in open #3).
- Merge-then-add-task interactions and nested orphan-into-extracted-project assignments (out of R5b-8b scope).
- Real Whisper transcription round-trip on iOS Safari (mocked in tests).

## Open items at merge time

**Resolved by R5b (close on merge):**
- #1 Merge-append bug — closed in R5b-6c via `order:'append'` Pass 3+4 unification.
- #7 R5b needs fully editable Review — bulk of R5b's scope; landed across R5b-5 → R5b-6c.
- #14 Stale Playwright spec — closed in R5b-8a/8b, 11-test suite replaces R3-era stub.
- #17 deleteProject orphan-conversion — closed in R5b-6b₂ (option (c): always convert, no prompt).

**Open — phone-test verification gates merge:**
- #2 App.jsx re-open loop on successful onboarding — verify on phone; if it manifests, blocks merge.
- #4 Drag heterogeneous-row jitter — phone test answers; if real, R5b-7 fix lands before merge.

**Open — production gap, NON-blocking (Phase 5 work):**
- #20 Board has no manual onboarding launcher — discovered during R5b-8b; tests use `?force-onboard=1`; production users with populated vaults can't re-enter onboarding. Phase 5 wires a Board affordance.
- #21 Match-toggle button label is the toggle target, not the current intent — discovered during R5b-8b test 9; two taps required from undecided state to reach CREATE NEW. Phase 8 polish unless phone test finds it actively confusing.

**Open — watch-during-dogfood, NON-blocking:**
- #6 Extraction quality on natural speech — council deliberation; may push to Phase 5.
- #8 Latent parallel-write race in api/backlog.js op:add — same shape as the resolved api/project.js bug; not yet observable; mirror the fix if it surfaces.

**SCHEDULED — polish post-Phase-4, NON-blocking:**
- #3 Unmount/abort race patterns (partial fix R5b-6c).
- #5 Committer identity auto-configured (user discretion).
- #9 Mic-gesture copy R5b-3c decision (defer or restructure).
- #11 CAPTURE_QUESTION duplicated across two components.
- #12 `error.recoverable` redundant with `error.variant`.
- #13 Mic-permission-denied misclassified as transcription failure.
- #15 / #16 / #18 Spec refresh items (OrphanPicker registry source, deviations, MATCH badge copy).
- #19 R5b-5 byte-accurate review gap (R5b-6 surfaces re-touched these files; no defects observed).

## What to look for during phone test (R5b-9b)

Verify each of the following on a real iOS device against the v2-phase4 Vercel preview URL. Test path requires either an empty vault or `?force-onboard=1`.

### Onboarding flow
- Voice capture works on iOS Safari (real mic, real Whisper round-trip — desktop tests stub both)
- Long capture (>30 seconds) completes without UI freeze or transcription drop
- Clarify path triggers when Opus returns `clarification_needed` and re-routes through capture mic
- Skip Clarify shortcut bypasses the second mic round
- Empty extraction (Opus returns no projects + no orphans) routes to `error` with `empty-extraction` variant + correct copy
- Transcribe failure shows `transcription` variant; RETRY returns to capture-ask cleanly

### Review surface
- Project name inline edit: tap name → input appears focused + selected → Enter commits / Escape reverts / blur commits-if-non-empty / blur-empty reverts (does NOT delete the project)
- Task text inline edit via ✎ button (the ONLY entry to edit mode; tapping `.task-text` directly does nothing — that's intentional, see TaskRow header note)
- Long-press on `.task-text` (~500ms hold) toggles urgent — known fragile interaction; if it doesn't fire reliably on real iOS Safari, that's a blocker (state/onboard.js item #13 covers misclassification but not gesture reliability)
- Drag-to-reorder projects in the project list (open #4 — this phone test is what decides if R5b-7 needs to land before merge)
- Drag-to-reorder tasks within an expanded project
- Delete project (×) converts child tasks to orphans (open #17 fix landed; verify it actually works on touch)
- + ADD PROJECT creates an editable empty project, focuses for naming
- + ADD TASK creates an editable empty task within the expanded project
- Match decisions render with correct copy: "MERGING INTO X" (auto-decided high confidence), "CREATING AS NEW" (after user-flip), "DECIDE: MERGE OR CREATE" (low-confidence undecided)
- LOCK IT IN button is disabled while undecided matches OR unassigned orphans OR empty project names exist; enabled otherwise

### Orphan picker (bottom sheet)
- Opens via ASSIGN → on an unassigned orphan row
- Three sections render: IN EXISTING PROJECT, IN A NEW PROJECT (FROM THIS CAPTURE) (when extracted projects exist), AS A NEW PROJECT (always rendered)
- Discard option works (sets `kind: 'deleted'`, row goes to strikethrough state)
- × close returns to review without dispatching (orphan stays unassigned)
- Backdrop tap closes
- Escape key closes (probably moot on iOS, verify on desktop)
- iOS safe-area inset on the sheet bottom doesn't clip the discard button

### Commit
- LOCK IT IN fires the orchestrator
- Progress UI updates per project/task as each lands ("LOCKING IN · N / M")
- "DONE · CLOSING…" splash, then onboard unmounts within ~1s
- Board re-fetches after `step === 'done'` and shows the committed projects
- App.jsx does NOT re-open onboarding after successful close (open #2 verification)
- Partial commit (e.g., one project fails 500) shows `error-partial-commit` variant with N FAILED count; RETRY clears error and routes back to review; second LOCK IT IN re-attempts only the failures (selective retry — Pass 1 + 2 + 3 + 4 all skip already-committed items)

### Known UX bugs (logged, not fixed in R5b)
- **Open #20** — Board has no manual onboarding launcher. Test access via `?force-onboard=1`. Phase 5 fix.
- **Open #21** — Match toggle button label is the toggle target, not the current intent. From undecided state ("DECIDE: MERGE OR CREATE"), tapping "CREATE NEW" flips to merge:TRUE (two taps required to reach actual CREATE NEW). Phone test verifies whether this is confusing in practice.
- **#13** — mic-permission-denied currently shows as `transcription` variant ("Didn't catch that. Try again?"). On a real device with denied permissions, "Try again" loops uselessly. Polish item; not blocking.

### Known fragile interactions (Playwright skipped, must verify manually)
- Drag-to-reorder — Playwright pointermove doesn't reliably trigger `lib/drag.js` thresholds; phone test is the first real exercise on touch. Watch for: jitter when projects are mixed expanded/collapsed (heterogeneous heights — open #4); ghost rendering; gesture conflict with long-press if both attach to similar targets.
- Long-press 500ms hold on `.task-text` — desktop test confirms gesture works at all; real iOS Safari touch behavior may differ (delayed pointercancel from scroll detection, accidental scroll cancellation, etc.).

## Recommended merge gate

**Blockers (any of these blocks R5b-9c merge):**
- Data loss: tasks committed under wrong project, duplicate project creation, lost edits, partial-commit retry double-creating projects.
- Navigation broken: app stuck in a loop, can't exit onboard, can't return to board after success.
- Commit fails to land vault data the user can see (round-trip to GitHub broken).
- Long-press doesn't toggle urgent on iOS Safari at all (gesture is non-functional, not just flaky).
- Drag-reorder is non-functional or produces wildly wrong ordering.

**Non-blockers (go to Phase 8 polish list, do not block merge):**
- Visual jitter during drag (open #4 — investigate post-merge if not severe).
- Match toggle two-tap UX confusion.
- Mic-permission misclassification copy (#13).
- Any cosmetic drift in `OnboardReview.css` from the open #19 byte-accuracy gap.

If a finding is ambiguous between blocker and polish, file it and ask. Better to delay merge by a day than ship data-loss.

## Untested in R5b (mock-vs-real divergences)

These are behaviors where the Playwright mock backend doesn't match real backend behavior. Phone test against an empty vault won't surface them; flagged for awareness during Phase 5+ work.

- **Slug collision on `/api/project` op:add** — real backend returns 409; mock returns success with the same slug. Test 8 sidesteps this by renaming the project before LOCK IT IN. Real backend behavior under collision is unverified at the orchestrator level. Phase 5 work that creates projects with similar names should test this directly.
- **Real Whisper transcription round-trip** — mocks return canned text; real Groq/Whisper handles audio quality, latency, and transcription accuracy variances that aren't exercised in tests.
- **Backend write race conditions** — open #8 names a latent parallel-write race in api/backlog.js op:add (same shape as the resolved api/project.js bug). Not yet observable; mirror the fix if it surfaces in Phase 5+ dogfooding.

## Post-merge follow-up

- **Phase 5a** wires Board onboarding launcher (closes open #20 — most likely a "+ NEW PROJECT" affordance or hamburger entry).
- **Phase 8 dogfood** polish list captures any non-blocking phone-test findings.
- **vault/build/phase4-open-items.md** gets archived (move to `vault/build/archive/phase4-open-items.md` or similar) at R5b-9c merge.
- **vault/build/phase4-session-handoff.md** is stale once Phase 4 closes — archive alongside open-items.
- **PHASES.md "Current state" block** needs refresh at R5b-9c — currently claims HEAD `892ff9b` / 41 commits ahead; actual is `c09981f` / 49 commits ahead, all of R5b landed.
- **`?force-onboard=1` URL parameter** is dev-only; the comment at App.jsx:46 says "Remove after Phase 4 merges and dedicated empty-vault testing is feasible." Decision deferred — keep for Phase 5 dev cycles, remove when stable.

## Verification command snapshot (run before R5b-9b begins)

```
git log --oneline main..v2-phase4 | wc -l    # expect 49
git status                                    # expect clean working tree
cd v2 && npm run lint                         # expect clean (zero exit)
cd v2 && npm run build                        # expect <50 KB JS gz, <20 KB CSS gz
cd v2 && npm test                             # expect 12/12 passing in ~14s
```

# Reviewer Context

Strategic context, quality standards, council composition guidance, and accumulated review learnings for `the-grind` V2 rebuild. Read by Dev Loop Protocol's Session Start (Step 3) and Phase 4 (Council Assembly).

## Project Domain

Solo-operator personal voice-first PWA. Single-user single-tenant task/project management. Daily-driver tool that organizes T.J.'s real life across 7+ ventures (the-grind itself, MARCUS, MCD/Motor City Deals, 708-Pallister real estate, Lionmaker brand, Pallister property, defi-cockpit, etc.).

Domain expert specialist for council assembly: **Daily-driver-tool product specialist** — someone who understands the workflow risks of breaking the user's own daily tool. The user IS the QA team; if a regression slips through, the user's day is broken.

## Risk Profile

- **Vault corruption risk** — `vault/` directory is GitHub-backed source-of-truth for real life-organizing data (not test data). Bad writes corrupt real state. Always seat a data-integrity specialist when vault writes are touched.
- **iOS Safari overlay quirks** — Phase 5a-10 spent 3 followups debugging Focus blank-screen before landing on `position: fixed` + `100vh` + `100dvh` + explicit background. Always seat a mobile-web specialist when overlay/modal/full-screen surfaces change.
- **Single auth mechanism** — `x-chief-token` header. No OAuth, no multi-tenant logic. Don't propose auth complexity.
- **`/api/*` serverless functions** — Vercel-hosted; write to GitHub Contents API. Historically frozen-by-default (Pattern 1). Dev Loop now governs new exceptions via codex review cadence.
- **iPhone-only deployment target** — Desktop UX doesn't matter; desktop Playwright is the dev verification surface, phone is truth. Tier 3 (manual phone test) is the final gate before merge.
- **Long-press text-selection conflict** — iOS Safari fires native context menu concurrently with longpress unless `user-select: none; -webkit-touch-callout: none` is set on the gesture target.

## What This Project Is

TheGrind V2 rebuild — Preact + Vite + nanostores + vanilla CSS PWA at https://the-grind-gold.vercel.app.

**Surfaces:**
- **Board** — project cards (top-3 tasks each, urgent-first sort, drag-reorder, EXECUTE button)
- **Onboard** — voice multi-project capture via Muse (capture/clarify/parsing/review + error variants + OrphanPicker)
- **Focus** — task work surface (Phase 5a stub; Phase 6 real Ring timer + pomodoro)
- **Muse** — always-on voice loop (per `vault/systems/muse-system.md`)
- **Backlog modal** (Phase 5b in progress) — full task list per project, drag-reorder, edit/check/delete

**Backend:** Vercel serverless `/api/*` (backlog, project, chief, transcribe, sync, upload) writing to GitHub Contents API at `vault/`.

**Stack lock (non-negotiable):** Preact + Vite + nanostores + vanilla CSS. No React, no TypeScript, no Tailwind, no component libraries.

## Architecture & Patterns

- **Optimistic-update + rollback convention** in nanostore mutators (boardStore 5a-4 established; backlogStore in 5b-3 inherits). Capture snapshot → compute optimistic immutably → write to store → await backend → on error: restore + set error + fetch authoritative state.
- **iOS Safari overlay pattern:** `position: fixed; z-index: 50; top:0; left:0; right:0; bottom:0; height: 100vh; height: 100dvh; padding-top: calc(var(--top-bar-h) + var(--s-4)); background: var(--bg);`
  - Never use `min-height: 100%` — requires explicit parent height that `#app` doesn't consistently provide
- **Drag composition:** `lib/drag.js` (8px engage threshold, window-level pointermove listeners) + `lib/longpress.js` (500ms hold, 8px move cancels). Both used together on TaskRow without gesture conflict.
- **Long-press targets** need `user-select: none; -webkit-touch-callout: none` to suppress iOS native context menu.
- **`/api/backlog.js` op-routing:** 8 mutating ops (add, remove, set_priority, toggle_urgent, complete, reorder, update_task_text, delete_task). All share latent `Promise.all([writeBacklog, touchRegistry])` race (BACKLOG.md item). Fix when surfaced should hit all 8 ops in one commit.
- **GET handlers read live from GitHub** (not bundled vault snapshot) — closes read-after-write consistency bug. See `fetchBacklogLive` / `fetchRegistryLive` in `api/_lib/vault.js`.
- **Council pattern:** Phase-level councils (Council 1, 2, 3 already deliberated Phase 4, 4-flow-redesign, Phase 5a) deliberate phase scope BEFORE sub-step implementation. Dev Loop's per-task Phase-4 council is additive — different cadence.
- **Codex review cadence:** Previously `/api/*`-only (Pattern 1 budget). Now codex review per Dev Loop Phase 2 on every change — broader cadence, lower per-touch ceremony.
- **Testid convention:** `<surface>-<element>-<id>` (e.g. `task-row-pal-015`, `backlog-task-text-pal-015`, `focus-back`, `backlog-modal-root`). Established in 5a-8 Playwright; carry forward.
- **Mock backend pattern:** `v2/tests/helpers/mock-backend.js` branches on `body.op`. Add new branches before the `op:add` fallback. Apply same normalization (trim/slice/etc) the real handler does so test assertions match production.

## Past Council Members That Added Value

- **2026-05-15 (5b-3):** Concurrency / Distributed Systems Engineer (adversarial) — caught that the generation guard solves modal-lifecycle races but NOT same-modal concurrent mutator races. Validated Codex Phase 2's deferred concern in concrete UX scenarios. Reinforced the "watch dogfood for resurrected/reverted tasks" trigger.
- **2026-05-15 (5b-3):** Daily-driver-tool product specialist — escalated the closed-modal silent-failure concern from "deferred" to "5b-6 must surface". Re-seat for any task surface where T.J. uses the tool 10+ times/day.
- **2026-05-15 (5b-3):** Mobile-Web / iOS Safari specialist — flagged the modal-with-Board-fetching backdrop-filter repaint cost. Re-seat for any modal/overlay work touching iOS Safari.
- **2026-05-15 (5b-3):** Frontend State Management Architect — flagged the `(args) => Promise<void>` mutator API inconsistency with normal Promise semantics. Decided to live with it (matches Phase 5a-4 boardStore convention).

## Cross-store sync conventions (established 5b-3)

Direction: **modal mutators → fetchBoard()** is the established cross-store sync pattern. Every successful backlogStore mutation calls fetchBoard() unconditionally to propagate to Board's top-3 summary. The generation guard suppresses the modal-store rollback write only — NOT the success-path fetchBoard.

Inverse direction (board → modal) is undefined. If Phase 6's Focus store ever mutates tasks while modal is mounted, it MUST decide whether to:
  (a) re-fetch backlogStore to refresh the modal
  (b) accept the modal's stale view until close

Default lean: (b) — modal sessions are short, cross-surface invalidation adds complexity for low-frequency conflict.

## Dogfood watch list (5b-3 council deferrals)

Watch for these reports during single-user dogfood; if any surfaces, the listed BACKLOG item triggers:

- **"Task I deleted came back"** OR **"Edit I made reverted"** → triggers concurrent-mutator-rollback fix (per-row lock or patch-based rollback). BACKLOG item.
- **"Modal scrolling is janky on iPhone"** OR **"Board flickered while I was editing"** → triggers fetchBoard debouncing + iOS profiling. BACKLOG item (loading flicker + GitHub API pressure entries).
- **"I deleted a task and there was no error but it stayed there"** → triggers closed-modal-failure surfacing (boardStore.error, toast, or inline retry). BACKLOG item.
- **"I made an edit and it never saved"** → 5b-6 implementation must surface save-failure visibly. NOT a BACKLOG item; this is a hard requirement for 5b-6 spec implementation.
- **"Muse FAB covers stuff in the backlog modal"** OR **"I keep tapping Muse by accident in the modal"** → triggers Muse-FAB hide-while-modal-open decision. Currently kept mounted per voice-first principle (Codex 5b-4 standard review flagged); flip to `!isActive && !openProjectId && <Muse />` in app.jsx if overlap surfaces. The bottom-right corner of the modal is where mockup 23 places the `+ ADD TASK` affordance (5b-5+ scope) — overlap with FAB is plausible.

## 5b-9 phone test agenda (5b-5 council forwards)

The phone test session at 5b-9 must explicitly verify these scenarios surfaced by 5b-5 council/codex:

1. **Drag-handle scroll-blocking on left rail.** Thumb-scroll the modal body starting from the left edge of any row. Drag handle has `touch-action: none`. Does scroll work or does drag engage? If drag engages on attempted scroll, fix needed (likely drag.js engagement threshold bump).
2. **Right-edge delete mis-tap during scroll.** Scroll the modal body, observe if × button at row's right edge triggers from finger movement near it. iPhone with bumper case especially.
3. **Multi-touch reorder behavior.** Intentionally drag URGENT row with one finger AND NORMAL row with another finger simultaneously. Do both controllers fire? Does backend handle the race? Theoretical scenario — only test if T.J. naturally encounters; don't engineer.
4. **Recurring task ✓ feedback gap.** Tap ✓ on fit-001 in the fitness project's modal. Row stays visible (fix landed). Does the absence of any visual feedback confuse? If yes, add brief flash/highlight band-aid (5 lines CSS) per Domain Expert recommendation; if no, defer to designed recurring-task UX.
5. **Resurrection scenario (concurrent mutator rollback).** Open modal with 3+ tasks. Throttle network in iOS Safari devtools (or actually be on flaky cellular). Tap ✓ on task A, within ~300ms tap × on task B. If A's request fails while B's succeeds (or vice versa), does the failed one's whole-snapshot rollback resurrect the other? If yes — concurrent-mutator BACKLOG item triggers; implement patch-based rollback (~80 lines).
6. **drag.js mixed-height row drop accuracy.** Drag a 1-line row past several 2-line rows. Verify drop position matches finger visual position, not skipping 2 slots.
7. **500-task perf.** Synthesize a 500-task fixture (vault edit acceptable; revert after). Open modal. Profile scroll, drag, render. If jank surfaces, virtualization fix needed.
8. **Edit input keyboard occlusion in modal lower half.** Tap-to-edit a task that's in the bottom 30% of the visible modal. iOS keyboard appears (~330px). Does the input stay visible? Does iOS scroll the modal to keep input above keyboard, or does it occlude? If occluded, visualViewport-based keyboard avoidance needed (~20 lines).
9. **Concurrent edit race (intentional).** Edit task A, blur (commits A async). Immediately edit task B, blur (commits B async). Throttle network in iOS Safari devtools so commits take ~3 seconds. Observe: do both commits land cleanly? Does either rollback racing the other resurrect/erase the other's edit? If yes, the concurrent-mutator BACKLOG entry triggers — implement patch-based rollback before merge.
10. **Chevron reads as attached to urgent count (visual)?** Codex 5b-7 Phase 3 noted that `12 URGENT / 47 ›` may read as one metadata string rather than a tappable affordance until hover/tap. The 10px flex gap helps but chevron has no border or contained shape at rest. If T.J. doesn't immediately understand the chevron is tappable on first encounter, consider faint resting background or larger left margin to visually detach. Probably a non-issue once familiar.
11. **Accidental chevron taps near header divider.** Real 44x44 button (Phase 3 fix) means hit area extends ~10px above and below the visible 32px-equivalent chevron position. Header has padding-bottom + border. Tap near the divider line at right side could open modal unexpectedly. Modal-open is non-destructive (user just closes) but worth verifying frequency.

## Pattern promotion candidates

- **`assignBucketedPriorities` / `sortByPriority` triplication** — same logic now duplicated in `api/_lib/vault.js`, `v2/src/state/board.js`, and `v2/src/state/backlog.js`. Three copies of bucket math + urgent-first sort. YAGNI threshold passed. Promote to `v2/src/lib/sort.js` when a fourth caller appears (likely Phase 6 Focus surface). Logged as a backlog item below.

- **Modal overlay pattern (Focus, BacklogDetail, MuseSheet, OnboardExitConfirm)** — `position: fixed; inset: 0; height: 100vh; height: 100dvh; z-index: N; padding-top: var(--top-bar-h); background: var(--bg);` is now established across 4 surfaces. Reusable as a CSS class `.modal-overlay` or a component primitive when a 5th surface lands.

  **IMPORTANT (Accessibility Engineer, 5b-4 council):** A11y deferrals are NOT part of the reusable pattern. Each new modal surface must re-decide: focus management on mount/close, Escape handler, inert background for assistive tech, aria-live for dynamic counts. BacklogDetail ships these as deferred per voice-first + iPhone-only context; do NOT copy the deferral by default when implementing a new modal surface.

## Modal-Board visual parity (established 5b-5)

Drag and long-press visuals on BacklogDetail modal are INTENTIONALLY identical to Board's drag and long-press visuals as of 5b-5:
- Both surfaces: translateY drag with `.dragging` class (cyan glow + shadow + bg)
- Both surfaces: `.longpress-active` amber outline during hold (no filling ring)
- Both surfaces: no ghost-row placeholder at drag origin (drag.js doesn't render it)

Spec Decision 10 originally aspired to ship ghost-row + amber-ring on modal-only in Phase 5b. Technical reality: implementing required either (a) extending drag.js + longpress.js with rendering callbacks that ripple to Board's controllers, or (b) hand-rolling parallel controllers for modal. Either path exceeded 5b-5 scope per Solo-operator velocity.

Both deferred to motion-polish sweep, landing simultaneously on Board + modal. Result: V2's first dogfood-ready BacklogDetail has visually consistent drag/longpress with Board, NOT mockup-33-fidelity. This is a feature: one mental model across surfaces.

Mockup 33's ghost-row + amber-ring fidelity should NOT be a 5b-9 phone test expectation. Future motion-polish sweep delivers them.

## Stacked-surface lifecycle ownership (established 5b-4)

When a top-precedence surface opens (currently: Onboard), it MUST hard-reset lower surfaces:
- `openOnboard()` calls `clearFocus()` + `clearBacklog()` before mounting
- `closeOnboard()` calls `clearFocus()` + `clearBacklog()` before resetting onboard state

Each store with state that could outlive a transition exposes a non-fetching `clear*()` export distinct from its user-facing `close()` (which may trigger cross-store sync via fetchBoard). The clear variant is for lifecycle orchestration; the close variant is for user-initiated dismissal.

If a 4th surface lands (e.g. Phase 7 PWA install dialog) with top-precedence, the openOnboard / closeOnboard pattern is the template. At 5+ surfaces, consider a surface-registry refactor.

## Things Previous Reviews Have Caught

Pre-Dev-Loop history (worth remembering even though not formally captured by the auto-learning convention):

- **2026-04-21:** macOS case-insensitive vs git case-sensitive paths — `git add v2/src/App.jsx` was no-op because git index has lowercase `v2/src/app.jsx`. Caught when 5a-2 followup needed. Pattern: always lowercase paths in `git add`.
- **2026-05-12 (5a-7 codex):** `urgent_count` would go stale after optimistic mutations in `completeTask` and `toggleTaskUrgent`. Fix: track urgent_count delta in mutators. Caught by Codex review.
- **2026-05-12 (5a-7 codex):** Drag-reorder vs concurrent fetchBoard race. Drag controller stores fromIdx/toIdx; if fetchBoard changes top[] mid-drag, reorder applies stale indices to fresh data. Logged in BACKLOG.md (deferred — defensive bounds check landed; full fix when surfaced).
- **2026-05-12 (5a-10 phone test):** Focus blank-screen on iPhone. Three followup attempts before `position:fixed` overlay fix landed. Stacking-context interaction with `#app/bg-gradient/grid-overlay/TopBar backdrop-filter` couldn't be debugged in iPhone-only environment. Pattern: overlay surfaces need fixed positioning, not min-height stacking.
- **2026-05-12 (5a-10 phone test):** iOS Safari longpress fires native context menu concurrently. Fix: `user-select: none; -webkit-touch-callout: none` on gesture targets. Pattern: any long-press target needs both properties.
- **2026-05-14 (5b-2 codex):** Mock backend echoed raw `body.text` for `op:update_task_text` without applying real backend's `trim().slice(0,200)` normalization. Tests would pass against behavior real backend won't deliver. Fix applied. Pattern: mock branches must mirror real-handler normalization.

(Auto-learning entries from Dev Loop Phase 5 will append below this line going forward.)

- 2026-05-15: optimistic-mutator generation guard pattern — needed for any nanostore that fans out to multiple components AND has async mutators that can outlive the modal/surface lifecycle. Caught by Codex adversarial review (5b-3 Phase 3).
- 2026-05-15: success-path cross-store sync should NOT inherit modal-lifecycle generation guards — backend committed regardless of modal state, so other stores need to learn. Caught by Codex adversarial review (5b-3 Phase 3).
- 2026-05-15: optimistic reorder MUST mirror backend priority-rewriting, otherwise subsequent local sorts re-shuffle dragged tasks back. Caught by Codex standard review (5b-3 Phase 2).
- 2026-05-15: drag-layer contract should be documented in the receiving store, not just the drag.js implementation — prevents downstream sub-steps from constructing malformed payloads. Caught by Concurrency Engineer (5b-3 council).
- 2026-05-15: closed-modal silent failure of destructive ops needs UI-level surface in the implementing component, not just store-level error setting — a 30x/day tool loses trust after 2-3 silent failures. Caught by Daily-driver-tool product specialist (5b-3 council).
- 2026-05-15: top-precedence surface (Onboard) must hard-reset lower surfaces (Focus, BacklogDetail) on both open AND close — left-armed state from a previous session can pop up unexpectedly when the top surface dismisses. Caught by Codex adversarial review (5b-4 Phase 3).
- 2026-05-15: dev-override URL params (?force-onboard, ?force-backlog) need explicit cross-flag guards — independent useEffects can race and create hidden-modal-behind-other-modal state. Caught by Codex adversarial review (5b-4 Phase 3).
- 2026-05-15: a non-fetching `clear*()` variant of a store's `close()` is the right primitive when another store's lifecycle needs to orchestrate clearance without triggering side effects. Pattern: `close()` for user-initiated dismissal (may fetchBoard); `clearBacklog()` for lifecycle-orchestrated dismissal (no side effects). Caught by State Lifecycle Architect (5b-4 council).
- 2026-05-15: modal pattern is reusable as CSS/component primitive, but a11y deferrals (focus management, Escape, inert background, aria-live) are explicitly NOT part of the reusable pattern — each new modal surface must re-decide. Caught by Accessibility Engineer (5b-4 council).
- 2026-05-15: recurring task semantic (vault stores `recurring: "daily"`, backend keeps status pending + stamps last_completed, frontend optimistic filter must NOT remove these or row disappears-then-reappears) — overlooked in initial implementation; verified real fit-001 recurring task exists in vault. Caught by Codex adversarial review (5b-5 Phase 3). Same bug exists in boardStore.completeTask — logged for separate fix.
- 2026-05-15: drag controller onReorder callbacks should read CURRENT store state at release time, not closed-over render-time arrays. Mirrors Board's ProjectCard pattern. Reduces stale-closure risk from non-id mutations that don't trigger controller rebuild. Caught by Codex adversarial review (5b-5 Phase 3).
- 2026-05-15: per-section drag controllers (one per URGENT, one per NORMAL) with full-list-payload construction is the right pattern for grouped lists where cross-section moves happen via separate gesture (long-press) rather than drag. Caught by 5b-5 implementation pass.
- 2026-05-15: iOS Safari input zoom-on-focus is prevented ONLY if font-size >= 16px. Cannot use rem-based design tokens (like var(--t-base) = 0.9rem = 14.4px); must declare 16px literal on input elements specifically. Visual difference vs surrounding text negligible at this size. Caught by Codex 5b-6 Phase 2 + verified via iOS Safari Specialist (5b-6 council).
- 2026-05-15: text inputs must declare autoComplete="off" + autoCorrect="off" + spellCheck={false} + enterKeyHint="done" to prevent browser autofill cross-contamination + iOS predictive suggestions cluttering task text. Pattern reusable for any future input surface. Caught by Codex 5b-6 Phase 3.
- 2026-05-15: lastAttempt preservation across save-failure rollback — user types "Pizza", save fails, store rolls back to "Tacos", retry button must NOT reset input to "Tacos" or user re-types from scratch. Single-line useState pattern with cleanup on success. Friction prevention for a 30x/day tool. Caught by Form/Input Interaction Specialist (5b-6 council).
- 2026-05-15: defensive React patterns accumulating in BacklogTaskRow (6 state pieces: editing, saveFailed, lastAttempt, inputRef, committingRef, mountedRef). Watch threshold: when row component hits 8+ state pieces OR 250+ lines, extract sub-modes (view-only vs edit-mode) into separate components. Caught by Architect (5b-6 council); re-evaluate at 5b-9.
- 2026-05-15: real 44x44 button + negative margins is more defensible than pseudo-element-expanded hit area on smaller visual buttons. Pseudo-element approach is harder to reason about across mobile browsers, zoom, accessibility tooling, and automated audits. Use negative margins to preserve adjacent layout when bumping button to iOS HIG minimum. Caught by Codex 5b-7 Phase 3.
- 2026-05-15: defensive fallback chains need belt-and-suspenders — `project.project_name || project.project_id || 'literal'` + `String()` coercion prevents render crash on `.toUpperCase()` if BOTH primary and secondary fallbacks are missing/non-string. Catching one but not the other is incomplete. Caught by Codex 5b-7 Phase 3.

---

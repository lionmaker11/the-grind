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

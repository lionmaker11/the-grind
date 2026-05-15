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

(Empty — auto-populates as Dev Loop runs and councils catch real issues.)

## Things Previous Reviews Have Caught

Pre-Dev-Loop history (worth remembering even though not formally captured by the auto-learning convention):

- **2026-04-21:** macOS case-insensitive vs git case-sensitive paths — `git add v2/src/App.jsx` was no-op because git index has lowercase `v2/src/app.jsx`. Caught when 5a-2 followup needed. Pattern: always lowercase paths in `git add`.
- **2026-05-12 (5a-7 codex):** `urgent_count` would go stale after optimistic mutations in `completeTask` and `toggleTaskUrgent`. Fix: track urgent_count delta in mutators. Caught by Codex review.
- **2026-05-12 (5a-7 codex):** Drag-reorder vs concurrent fetchBoard race. Drag controller stores fromIdx/toIdx; if fetchBoard changes top[] mid-drag, reorder applies stale indices to fresh data. Logged in BACKLOG.md (deferred — defensive bounds check landed; full fix when surfaced).
- **2026-05-12 (5a-10 phone test):** Focus blank-screen on iPhone. Three followup attempts before `position:fixed` overlay fix landed. Stacking-context interaction with `#app/bg-gradient/grid-overlay/TopBar backdrop-filter` couldn't be debugged in iPhone-only environment. Pattern: overlay surfaces need fixed positioning, not min-height stacking.
- **2026-05-12 (5a-10 phone test):** iOS Safari longpress fires native context menu concurrently. Fix: `user-select: none; -webkit-touch-callout: none` on gesture targets. Pattern: any long-press target needs both properties.
- **2026-05-14 (5b-2 codex):** Mock backend echoed raw `body.text` for `op:update_task_text` without applying real backend's `trim().slice(0,200)` normalization. Tests would pass against behavior real backend won't deliver. Fix applied. Pattern: mock branches must mirror real-handler normalization.

(Auto-learning entries from Dev Loop Phase 5 will append below this line going forward.)

---

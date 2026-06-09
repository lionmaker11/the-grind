# Phase 6 — Focus surface + Ring timer (spec)

**Date:** 2026-05-16
**Status:** Spec finalized; implementation follows
**Predecessor:** Phase 5b merged to main (6c31fc8); production verified

## What ships

The real Focus surface replacing the 5a stub: Ring SVG timer (the sacred
piece, ported verbatim from mockup 06), pomodoro session state machine
(work/break/reboot), pomodoro count picked AT LAUNCH (session state, not
planning state — the Council 3 relocation from Phase 5b), wall-clock
drift-free ticking, localStorage session persistence across reloads/
backgrounding, mode-tinted ambient gradient, TopBar POMO status.

Authoritative inputs: DESIGN.md §state/timer.js (store shape + actions,
quoted verbatim below), DESIGN.md §Focus.jsx/§Ring.jsx, mockups
06-focus-work / 07-focus-paused / 08-focus-break / 09-focus-reboot,
mockup 24 (pomodoro glyph semantics, relocated).

## Decisions

### D1 — Store: `state/timer.js` per DESIGN.md contract
Shape: `{ mode: 'idle'|'select'|'work'|'break'|'long-break', timeLeft,
totalTime, running, endTimestamp, currentTask: {id, text, project_id,
project_name}|null, pomosCompleted, sessionPomos, plannedPomos }`.
`'select'` is a Phase-6 addition to DESIGN's enum: the at-launch
pomodoro-count picker state (DESIGN predates the Council 3 relocation).
Actions: `launch(task)`, `startWork(plannedPomos)`, `pause()`,
`resume()`, `skip()`, `reset()`, `setMode(mode)`, `exitToBoard()`,
internal `completeSegment()` + `tick()`.

### D2 — Drift-free ticking + persistence
`tick()` computes `timeLeft = ceil((endTimestamp - Date.now())/1000)`
every 250ms while running (DESIGN). Full state persisted to
localStorage (`grind-timer-v1`) on every change; hydrated at module
load; elapsed-while-away segments are completed in sequence on hydrate
(catch-up chain). Pause stores remaining seconds and clears
endTimestamp; resume recomputes endTimestamp.

### D3 — Durations + cycle
Classic pomodoro per mockups: WORK 25:00 (cyan), BREAK 05:00 (green),
REBOOT 15:00 (magenta, = DESIGN's 'long-break'). Cycle: work →
(sessionPomos < plannedPomos ? break → work … : reboot). Reboot end →
session complete → idle → Board. Session dots render plannedPomos dots,
filled = completed work segments (reboot state shows all filled,
magenta, per mockup 09).

### D4 — Launch flow (pomodoro relocation)
▶ / EXECUTE → focusStore bridge (unchanged App.jsx render switch) →
Focus mounts in `select` mode → 4 pomo glyphs (1-4) per mockup 24
semantics; SINGLE TAP on glyph N starts work with plannedPomos = N
(minimal-tap per voice-first principle; no separate START button).

### D5 — Controls per mockups
↻ = restart current segment. Primary = PAUSE/RESUME (work) or SKIP
(break/reboot). ⏭ = advance to next segment (counts a work segment as
completed — "done early" semantics, solo-operator pragmatism). Mode
tabs FOCUS/BREAK/REBOOT switch segment type directly (resets segment
to that mode's duration; FOCUS tab does not increment sessionPomos).

### D6 — Back to Board keeps the session
`← BOARD` unmounts Focus view, timer keeps running (persisted). TopBar
shows `POMO n / m` (running) or `POMO n / m :: PAUSED` per mockups 06/07
whenever mode ∉ {idle, select}; priority: action > pomo > offline >
clock. Re-entry: ▶ on the SAME task resumes the running session;
launching a DIFFERENT task replaces the session (deliberate action,
no confirm — solo operator).

### D7 — Ring.jsx: sacred SVG, verbatim port
From mockup 06: pulse circle (animates only while running), rotating
outer hex (20s), counter-rotating dashed inner hex (30s), base circle
r=108, progress circle (dasharray 678.58 = 2π·108, dashoffset =
678.58 · (1 − timeLeft/totalTime)), 60 generated tick lines (every 5th
at opacity .55, rest .22), inner display (time + `// MODE` label).
Colors via a `--ring-color` CSS custom property set per mode (cyan/
green/magenta) so one SVG serves all modes. prefers-reduced-motion
disables hex rotation + pulse.

### D8 — Ambient + completion feedback
`.bg-gradient` gains mode class (work/break/long-break) per DESIGN
§247. Segment completion: try/catch navigator.vibrate(100) + short
WebAudio beep (two-tone, <0.2s, AudioContext lazily created on first
user gesture, silent failure). No notifications API in Phase 6.

### D9 — No task-complete on Focus
Mockups 06-09 show no ✓ affordance on Focus; completion stays on
Board/modal. Gate 5 ("task progress persists") is satisfied by session
persistence + pomosCompleted counter. Revisit post-dogfood.

### D10 — focusStore stays as the mount bridge
focusStore (5a) keeps driving App.jsx's render switch; launchTask now
also calls timer.launch(task). timer.exitToBoard() clears focusStore.
clearFocus (onboard lifecycle) also resets the timer — onboard
takeover cancels a running session (hard reset per stacked-surface
lifecycle convention).

## Sub-steps
6-1 spec (this doc) · 6-2 state/timer.js + persistence ·
6-3 Ring.jsx/.css · 6-4 Focus rebuild + TopBar + ambient + wiring ·
6-5 Playwright tests (timer flows with mocked clock where possible) ·
6-6 status + merge.

## Test plan (minimum)
1. Launch → select mode shows 4 glyphs; tap 2 → work starts 25:00, dots=2
2. Pause → RESUME label + `:: PAUSED` TopBar; resume → ticking continues
3. ⏭ during work → break starts 05:00, dot 1 filled
4. SKIP during break → next work starts
5. Mode tab BREAK during work → break segment, no dot fill
6. ↻ restarts current segment at full duration
7. ← BOARD keeps session; TopBar shows POMO 1 / 2; ▶ same task re-enters
8. Launch different task replaces session
9. Reload mid-work (localStorage) → session restored with correct timeLeft
10. Ring progress dashoffset reflects timeLeft/totalTime

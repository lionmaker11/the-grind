# DESIGN.md — TheGrind V2

> A Lionmaker system. Single-operator, voice-first, agentically-planned digital planner.
> This file is the aesthetic + architectural contract for V2. Read it before writing a single line of code. Every component, every token, every interaction lives under the rules below.

---

## 0 · North Star

**Three verbs: surface, focus, check off.** Everything else is theater.

**Two surfaces: Board (default) and Focus (Pomodoro takeover).** No router. State toggle. Board *becomes* Focus — doesn't navigate away.

**One overlay: Muse.** FAB bottom-right, slide-up sheet, voice-first. Available everywhere.

**One user: the operator.** No multi-tenant, no accounts, no onboarding, no marketing surfaces in-app. He's already authenticated by being him.

---

## 1 · Aesthetic Contract

### Tone

Cyberpunk mission control. Teenage Engineering × Linear × Ghost in the Shell. An operator's console, not a wellness app. When he opens it on his worst day he should feel like he's running a war room, not filling out a form.

### What it never is

- Light mode, ever
- Rounded pastel cards, soft shadows, friendly micro-copy
- Generic productivity SaaS (no kanban columns, no calendar grids, no checkbox squares)
- Gamification theater (no XP, no levels, no achievements, no streak counters, no celebration overlays)
- Congratulatory toward the operator for doing his work
- Emoji-laden (glyphs allowed: ▶ ✓ ● ↻ ◆ ◇ | emojis in UI text forbidden; Muse text is emoji-free)
- Narrative walls of text anywhere
- Modal-blocker heavy — nothing blocks the board; sheets slide up from bottom

### What it always is

- Dark (bg `#0a0a12`, always)
- Information-dense without noise
- Commanding, terse, operator-to-operator in voice
- Phone-first, 460px max-width container centered, safe-area-aware
- Scanlines + CRT vignette + subtle grid overlay (the signature ambient layer)
- Sharp right angles and 2px borders over soft radii (radii max 4px, used sparingly)
- Cyan signal color for active state, everywhere

---

## 2 · Design Tokens

All tokens live in `src/tokens.css` as CSS variables. Never use hex values directly in component styles — always reference the token.

### Colors

```css
:root {
  /* Primary palette */
  --cyan:        #00f0ff;   /* signal, active, primary accent */
  --cyan-dim:    rgba(0, 240, 255, 0.3);
  --cyan-glow:   rgba(0, 240, 255, 0.5);

  --magenta:     #ff00de;   /* Muse, voice, recording */
  --magenta-dim: rgba(255, 0, 222, 0.3);
  --magenta-glow:rgba(255, 0, 222, 0.5);

  --gold:        #d4a04a;   /* Lionmaker brand, rare use only */
  --gold-bright: #e8b860;

  --silver:      #c5ccd6;   /* Lionmaker secondary, supporting */

  /* Status palette */
  --green:       #39ff14;   /* done, healthy heartbeat */
  --green-glow:  rgba(57, 255, 20, 0.4);

  --yellow:      #ffe600;   /* warning, 3-day stale heartbeat */
  --yellow-glow: rgba(255, 230, 0, 0.5);

  --red:         #ff003c;   /* overdue, 7-day red heartbeat */
  --red-glow:    rgba(255, 0, 60, 0.5);

  --indigo:      #7b5cff;   /* break mode, secondary */
  --indigo-glow: rgba(123, 92, 255, 0.5);

  /* Neutrals */
  --bg:          #0a0a12;              /* app background */
  --bg-panel:    rgba(10, 15, 30, 0.85); /* card / panel */
  --bg-sheet:    rgba(10, 10, 18, 0.98); /* Muse sheet (opaque) */

  --border:          rgba(0, 240, 255, 0.12);
  --border-bright:   rgba(0, 240, 255, 0.30);

  --text:       #e0e6f0;                       /* primary */
  --text-dim:   rgba(200, 210, 230, 0.55);     /* secondary */
  --text-muted: rgba(200, 210, 230, 0.30);     /* placeholder */

  /* Priority color map — referenced by P-badges */
  --p1: var(--cyan);
  --p2: var(--green);
  --p3: var(--yellow);
  --p4: var(--indigo);
  --p5: var(--text-dim);
}
```

### Typography

Load via Google Fonts at the top of `global.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
```

**Three faces, three jobs:**

| Face | Weight | Use for |
|---|---|---|
| **Orbitron** | 400–900 | Display, titles, headings, wordmark, level-up moments. Generous letter-spacing (2–8px). |
| **Share Tech Mono** | regular only | All data readouts, task IDs, timestamps, counts, priority badges, code-like labels, terminal output, ambient chrome text like `// AWAITING INPUT`. |
| **Rajdhani** | 400–700 | Body copy, task text, Muse messages, anything that needs to read as prose. |

**Never introduce a fourth face.** If something doesn't fit one of these three jobs, it's the wrong thing to put on screen.

**Type scale** (for reference, not rigid):

```css
--t-xs:   0.55rem;  /* Share Tech Mono, chrome labels */
--t-sm:   0.7rem;   /* Share Tech Mono, data */
--t-base: 0.9rem;   /* Rajdhani, body */
--t-md:   1.05rem;  /* Rajdhani, emphasized */
--t-lg:   1.4rem;   /* Orbitron, section titles */
--t-xl:   2.4rem;   /* Orbitron, timer display on phone */
--t-2xl:  3.2rem;   /* Orbitron, timer display on desktop */
```

### Spacing

Use a 4px base. Don't invent values between steps.

```css
--s-1:  4px;
--s-2:  8px;
--s-3:  12px;
--s-4:  16px;
--s-5:  20px;
--s-6:  24px;
--s-8:  32px;
--s-10: 40px;
--s-12: 48px;
--s-16: 64px;
```

### Radii

```css
--r-sm: 2px;   /* badges, small elements — default */
--r-md: 4px;   /* panels, cards */
--r-lg: 8px;   /* FAB, phone-edge things */
--r-round: 50%; /* circles only */
```

Radii > 8px are forbidden unless it's a circle. No pill buttons, no rounded cards.

### Motion

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1); /* snappy, confident */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* balanced */

--dur-micro: 150ms;  /* micro-interactions, hover states */
--dur-fast:  250ms;  /* button press, toast in */
--dur-base:  350ms;  /* surface transitions (Board ↔ Focus) */
--dur-slow:  500ms;  /* ambient, ring updates */
```

Any duration outside these is wrong.

### Dimensions

```css
--container-max: 460px;
--top-bar-h:     56px;
--fab-size:      52px;
--touch-min:     44px;  /* iOS HIG, enforce on every interactive element */
--sheet-h:       55vh;  /* Muse sheet max height */
--ring-size:     250px; /* Pomodoro ring on phone */
```

---

## 3 · Ambient Layer (the signature effects)

These three always-on effects are non-negotiable brand. They apply at the body level once, and every surface inherits them.

### Scanlines

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}
```

### CRT vignette

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 999;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.5) 100%
  );
}
```

### Subtle grid background

```css
.grid-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### Ambient gradient (mode-reactive)

One fixed `<div class="bg-gradient">` behind everything. Its class changes with timer mode to subtly shift the ambient color. See `tokens.css` for `.bg-gradient.work`, `.bg-gradient.break`, `.bg-gradient.long-break` — three radial + linear gradient combos, each tuned to the mode's primary color.

---

## 3a · Project Lifecycle

Projects are managed **voice-primary, UI-minimal.** Muse handles all project operations (add, archive, activate, rename, reorder) through her existing tool manifest (`add_project`, `archive_project`, `activate_project`). The UI provides exactly one discoverability affordance for project creation. Nothing else.

### What the UI exposes

**`+ NEW PROJECT` ghost-row.** Rendered at the bottom of the Board surface, below the last project card, above the EXECUTE button. Full-width minus standard margins, 44px min-height, dashed 1px border in `var(--border)`, Share Tech Mono 0.7rem, letter-spacing 1.5px, `var(--text-dim)` color. Text: `+ NEW PROJECT`.

**Interaction:** tap opens the Muse sheet with the text input pre-populated with `new project: `. User completes the sentence by voice or text, hits send, Muse executes `add_project` tool call, board re-fetches. If user closes the sheet without sending, the pre-populated text clears (no dead state).

**`// NEW PROJECT? JUST TELL MUSE.` teaching line.** Rendered in the EmptyState at the bottom-center of the empty-state content area. Share Tech Mono 0.6rem, letter-spacing 2px, `var(--text-muted)` color. This teaches the voice-first project-add pattern without adding visual chrome on the populated-board case.

**`+ ADD PROJECT` ghost-button.** Rendered at the bottom of the Onboard Review surface, above the LOCK IT IN CTA. Same style as the `+ NEW PROJECT` ghost-row. Allows the user to add projects during first-run setup that the three-question interview missed.

### What the UI explicitly does not expose

- **No archive affordance.** User asks Muse ("archive MARCUS"). Muse executes. TopBar shows 10s undo.
- **No rename affordance.** User asks Muse ("rename Pallister to 1300 Porter"). Muse executes.
- **No reorder affordance.** User asks Muse ("make MARCUS my top priority"). Muse executes.
- **No activate-from-archived UI.** User asks Muse ("bring back MARCUS"). Muse executes.
- **No project-settings panel, context menu, or long-press action sheet.** None of these. Ever.

### Rationale

These are rare, high-consequence actions. Voice is faster than any UI we could design, and the existing 10-second undo pattern covers the "wrong project" regret case. Adding UI affordances for low-frequency actions creates discoverability debt (the user has to hunt for the button the one time per month they need it) and invites accidental triggers. Delegate to Muse. Trust the undo.

### Muse's defaults for project operations

When Muse creates a project via voice with no stated priority, she assigns `priority = max_existing_priority + 1` (new project sinks to the bottom). The user reorders later via voice if they want it higher. Zero friction on add.

When Muse archives a project, any pending tasks remain on disk under `vault/projects/{id}/backlog.json` but are not rendered on the board. If the project is reactivated, tasks return in their pre-archive state.

### Future consideration (NOT V2)

If dogfood reveals that voice-only is insufficient for specific operations (e.g., bulk archive at quarter-end), revisit. Do not pre-build these affordances in V2. The bar for adding any project-management UI post-V2 is: "this voice operation actually failed at least 3 times in real use."

---

## 4 · Component Patterns

### Panel

Used for project cards, Muse sheet interior, stat tiles. Never a `<CyberPanel>` wrapper component — a CSS class applied to a `div`.

```css
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  backdrop-filter: blur(12px);
  position: relative;
}

/* Top stripe — thin cyan line fading at the edges */
.panel::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
}

/* Corner accents — applied via 4 empty children */
.panel > .corner-tl,
.panel > .corner-tr,
.panel > .corner-bl,
.panel > .corner-br {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--cyan);
  border-style: solid;
  opacity: 0.5;
  pointer-events: none;
}
.panel > .corner-tl { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.panel > .corner-tr { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
.panel > .corner-bl { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
.panel > .corner-br { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
```

### Priority Badge

```css
.p-badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 1.5px;
  padding: 3px 6px;
  border-radius: var(--r-sm);
  border: 1px solid;
  min-width: 26px;
  text-align: center;
  flex-shrink: 0;
}
.p-badge.p1 { color: var(--cyan);   border-color: var(--cyan);   background: rgba(0,240,255,0.08); }
.p-badge.p2 { color: var(--green);  border-color: var(--green);  background: rgba(57,255,20,0.06); }
.p-badge.p3 { color: var(--yellow); border-color: var(--yellow); background: rgba(255,230,0,0.06); }
.p-badge.p4 { color: var(--indigo); border-color: var(--indigo); background: rgba(123,92,255,0.06); }
.p-badge.p5 { color: var(--text-dim); border-color: var(--text-dim); background: transparent; }
```

### Heartbeat Dot

A single 8px circle next to the project name.

```css
.heartbeat {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.heartbeat.green  { background: var(--green);  box-shadow: 0 0 6px var(--green-glow); }
.heartbeat.yellow { background: var(--yellow); box-shadow: 0 0 6px var(--yellow-glow); }
.heartbeat.red    { background: var(--red);    box-shadow: 0 0 6px var(--red-glow); animation: pulse-red 2s ease-in-out infinite; }

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 4px var(--red-glow); }
  50%      { box-shadow: 0 0 10px var(--red-glow); }
}
```

**Logic** (`lib/heartbeat.js`): compare `project.last_touched` to today. Pull `last_touched` from the registry, which the backend already updates on every backlog mutation.

**Heartbeat null-state:** Projects with `last_touched === null` render dim gray (`var(--text-muted)`, 40% opacity). This covers cold projects that have not mutated since the `last_touched` field was introduced.

**Thresholds:**

| Age | Color | Animation |
|---|---|---|
| `null` | dim gray | none |
| 0–3 days | green | none |
| 3–7 days | yellow | none |
| 7+ days | red | 2s ease-in-out pulse |

### Button patterns

Three button types. That's it.

**Primary action** (EXECUTE button on Board, mode tabs on Focus):

```css
.btn-primary {
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--cyan), #00c8ff);
  color: #000;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  border: none;
  border-radius: var(--r-sm);
  box-shadow: 0 0 30px var(--cyan-dim);
  cursor: pointer;
  transition: filter var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  min-height: var(--touch-min);
}
.btn-primary:active { transform: scale(0.97); }
.btn-primary:hover  { filter: brightness(1.2); }
```

**Icon button** (reset, skip, check, launch on rows):

```css
.btn-icon {
  width: var(--touch-min);
  height: var(--touch-min);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all var(--dur-micro) var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover            { color: var(--cyan); border-color: var(--cyan); }
.btn-icon.launch:hover     { color: var(--cyan);  border-color: var(--cyan); }
.btn-icon.check:hover      { color: var(--green); border-color: var(--green); }
.btn-icon.destructive:hover{ color: var(--red);   border-color: var(--red); }
```

**Ghost button** (secondary actions, Muse sheet close, etc.):

```css
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 2px;
  padding: 8px 14px;
  border-radius: var(--r-sm);
  min-height: var(--touch-min);
  cursor: pointer;
}
```

### Section Title

The eyebrow pattern above sections (Board, empty state, Muse header):

```css
.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: var(--s-3);
}
.section-title::before {
  content: '> ';
  color: var(--magenta);
}
```

---

## 5 · The 23 Components

Component tree, in build order. Each entry has: file, purpose, props, interactions, state ownership.

### `src/main.jsx`
Entry. Mounts `<App />` to `#app`. 10 lines.

### `src/app.jsx`
Root. Reads `timer.mode` from store. Renders either `<Board />` or `<Focus />` as the main surface. Always renders `<TopBar />` (fixed top) and `<Muse />` (FAB + sheet, fixed overlay). 50 lines max.

```jsx
// Pseudo
const mode = useStore(timer).mode;
return (
  <>
    <div class="bg-gradient" data-mode={mode} />
    <div class="grid-overlay" />
    <TopBar />
    {mode === 'idle' ? <Board /> : <Focus />}
    <Muse />
  </>
);
```

### `src/components/TopBar/TopBar.jsx` + `.css`
Fixed top, 56px, safe-area-aware. Contains: Lionmaker logo (22px), "THEGRIND" wordmark (Orbitron 0.7rem, letter-spacing 4px), and a rotating status line on the right that shows either the last Muse action (with undo affordance, 10s window) or the time of day in Share Tech Mono.

Props: none (reads from `muse.lastAction` store).

States: default | undo-active (last 10s after any Muse action).

### `src/components/Board/Board.jsx` + `.css`
Main surface. Vertical scroll list of project cards, sorted by registry priority, then alphabetical. Renders `<EmptyState />` inline if no projects have pending tasks. Bottom of list (non-empty case): the `+ NEW PROJECT` ghost-row followed by the `<ExecuteButton />`. See Section 3a for ghost-row behavior.

Props: none (reads from `board` store).

Subscribes to `board.summary`. Triggers `board.fetchBoard()` on mount and on `muse.lastActionAt` change. The `+ NEW PROJECT` ghost-row calls `muse.open({ prefill: 'new project: ' })` on tap.

### `src/components/Board/ProjectCard.jsx`
One card per project. Header row (tappable to open drawer — **deferred to later**, not V1): heartbeat dot + project name (Orbitron 0.78rem) + pending count (Share Tech Mono). Below: up to 3 `<TaskRow />` components. If zero tasks, shows "// empty" in Share Tech Mono.

Props: `{ project }` where project = `{ project_id, project_name, top[], task_count, last_touched }`.

### `src/components/Board/TaskRow.jsx`
One row per task. Layout: `[P-badge] [task text, truncated] [icon-btn: launch ▶] [icon-btn: check ✓]`. 44px min height. Tap text or launch button = launch Pomodoro. Tap check = complete. Tap P-badge = cycle priority 1→2→3→4→5→1.

Props: `{ task, project }` where task = `{ id, text, priority, estimated_pomodoros, last_completed }`.

States: default | done-today (recurring tasks stamped today) | completing (fade-out animation, 300ms).

### `src/components/Board/HeartbeatDot.jsx`
Trivial. Takes `{ lastTouched }`, renders 8px circle with green/yellow/red class via `lib/heartbeat.js`.

### `src/components/Focus/Focus.jsx` + `.css`
Takeover surface when `timer.mode !== 'idle'`. Layout, top to bottom:
- Back-to-board button (top-left, ghost, tiny)
- Task name (Orbitron 0.65rem, letter-spacing 2px, cyan)
- Project name (Share Tech Mono 0.6rem, dim)
- Pomodoro progress line: `POMO 2 / 4` (Share Tech Mono, magenta)
- Mode tabs (FOCUS / BREAK / REBOOT) — only active mode shown prominently
- `<Ring />` — the 250px SVG timer
- Controls row: reset ↻ · EXECUTE/PAUSE · skip ⏭
- Session dots (4 diamond shapes showing quarter progress)

Subscribes to `timer` store.

### `src/components/Focus/Ring.jsx`
The SVG ring. **Ported from V1 nearly verbatim** — this is the sacred piece. Outer hex-ring decoration (rotating), inner hex-ring (counter-rotating, dashed), pulse ring (running state), progress ring (stroke-dashoffset tied to `timer.timeLeft / timer.totalTime`), inner timer display (Orbitron 2.8rem digits + Share Tech Mono label below).

Props: `{ mode, timeLeft, totalTime, running }`.

Pure display component. No store access.

### `src/components/Muse/Muse.jsx` + `.css`
Container that renders:
- `<MuseFab />` when closed
- Backdrop (`rgba(0,0,0,0.5)`, 300ms fade) when open
- Sheet when open

Sheet: fixed bottom, 55vh, border-top 2px magenta, transform translateY(100%) ↔ translateY(0) via 350ms ease-out. Header: magenta dot + "MUSE" + "// online" / "// offline" status. Body: scrollable message list. Footer: text input + mic button, padded for safe area.

Subscribes to `muse` store. Accepts optional prefill on open via `muse.open({ prefill })` — if provided, the input is pre-populated with the prefill text (e.g., `'new project: '`) and the user's cursor sits at the end. If the user closes the sheet without sending, the prefill clears (no dead state).

### `src/components/Muse/MuseMessage.jsx`
One message bubble. Three variants:
- `.user` — right-aligned, cyan-tinted background (`rgba(0,240,255,0.1)`), cyan border, Rajdhani
- `.muse` — left-aligned, magenta-tinted background (`rgba(255,0,222,0.08)`), magenta border, Rajdhani
- `.action` — center-aligned narrow bubble, yellow-tinted, Share Tech Mono, for action confirmations like `"+ filed to Pallister (P2)"`

Props: `{ role, content }`.

### `src/components/Muse/MuseInput.jsx`
Bottom of sheet. Text input (Rajdhani, 16px to prevent iOS zoom) + mic button (magenta-bordered, 40px round, tap or hold-to-record). Send icon-button activates when text present OR after voice transcription completes.

States: idle | recording (magenta pulse animation on mic) | transcribing | sending.

Mic behavior: single-tap toggles recording (Web Speech API first, MediaRecorder + Whisper fallback). Touch-hold also works. On release/stop, transcribed text populates input, then auto-sends after 800ms unless user edits.

---

## 6 · State Architecture

Three nanostores. Each is ~50 lines. Zero cross-imports between stores.

### `state/board.js`
```js
// Shape
{
  summary: [ { project_id, project_name, priority, task_count, top: [...], last_touched } ],
  loading: boolean,
  error: string | null,
  lastAction: { type, label, ts } | null,  // for undo rotation in TopBar
}

// Actions
fetchBoard()
completeTask(projectId, taskId)
setPriority(projectId, taskId, priority)
addManualTask(projectId, text, priority)  // rarely used, voice is primary
```

On every successful mutation: re-calls `fetchBoard()` to refresh. Sets `lastAction` with a 10s undo window.

### `state/timer.js`
```js
// Shape
{
  mode: 'idle' | 'work' | 'break' | 'long-break',
  timeLeft: number,      // seconds
  totalTime: number,
  running: boolean,
  endTimestamp: number | null,  // wall-clock end, for drift-free calc
  currentTask: { id, text, project_id, project_name, estimated_pomodoros } | null,
  pomosCompleted: number, // today
  sessionPomos: number,   // consecutive, resets on break end
}

// Actions
launch(task)      // sets mode='work', currentTask, starts tick
pause()
resume()
skip()
reset()
complete()        // internal, called when timeLeft hits 0
tick()            // computes timeLeft from endTimestamp - Date.now()
```

Ticks every 250ms while `running`, computing `timeLeft` from wall-clock. Persists full state to `localStorage` on every change so a page refresh or PWA backgrounding doesn't lose the session. On mount, hydrates from localStorage and computes current `timeLeft` from stored `endTimestamp`.

### `state/muse.js`
```js
// Shape
{
  messages: [ { role: 'user'|'assistant'|'action', content, ts } ],
  isOpen: boolean,
  isRecording: boolean,
  isSending: boolean,
  voiceText: string,  // while transcribing
  status: 'online' | 'offline' | 'connecting',
}

// Actions
open()
close()
send(text)
recordStart()
recordStop()
clearHistory()   // on day rollover
```

`send()` hits `/api/chief` with `{ message, conversation, firstTurnToday }`. On response, appends assistant message, then executes each action in `response.actions` via `api.js` calls (e.g., `api.backlogAdd(...)`, `api.backlogSetPriority(...)`). After all actions resolve, calls `board.fetchBoard()` to refresh. Each action also appends an `.action` role message to the log (`"+ filed to Pallister (P2)"`) for transparency.

Max 30 messages retained in memory. Persisted to `localStorage` per day (key includes date).

---

## 7 · Data & API

**Zero backend changes in V2.** All endpoints already exist. Reference:

| Method | Endpoint | Purpose |
|---|---|---|
| GET  | `/api/backlog` | Summary for board render |
| GET  | `/api/backlog?project_id=X` | Full project backlog (drawer, later) |
| POST | `/api/backlog` | ops: `add`, `complete`, `set_priority`, `reorder`, `load` |
| POST | `/api/project` | ops: `add`, `archive`, `activate` |
| POST | `/api/chief` | Muse conversation, returns `{ text, actions[] }` |
| POST | `/api/transcribe` | Voice → text (Groq Whisper) |
| POST | `/api/sync` | `conversation_append` (log Muse exchange to vault) |

**All mutating endpoints require header:** `X-Chief-Token: <CHIEF_AUTH_TOKEN>`.

### `src/lib/api.js`
Single fetch wrapper. Adds auth header, handles retry on GET (2 retries, exponential backoff 300ms/600ms), surfaces POST errors to the store. Functions:

```js
getBacklog()
getProjectBacklog(projectId)
backlogAdd(projectId, task)
backlogComplete(projectId, taskId)
backlogSetPriority(projectId, taskId, priority)
chief(message, conversation, firstTurnToday)
transcribe(audioBase64, mimeType)
syncConversationAppend(lines)
```

### `src/lib/voice.js`
Voice input. Web Speech API first (free, fast, works in Safari). On failure (NotAllowed, ServiceNotAllowed, Network, or not supported), falls back to MediaRecorder → `api.transcribe()`. Expose: `startRecording()`, `stopRecording()` returning promise → `string`.

### `src/lib/heartbeat.js`
Pure function. `heartbeatFor(lastTouchedISO) → 'green' | 'yellow' | 'red'`. 0–2 days → green, 3–6 → yellow, 7+ → red. No `last_touched` → red (probably a dormant project).

---

## 8 · Offline Strategy

**Service worker** (`sw.js`) caches:
- App shell (index.html, JS bundle, CSS bundle, fonts, icons)
- Last successful `GET /api/backlog` response (stale-while-revalidate)

**Offline behavior:**
- Board renders from cache ✓
- Timer runs (100% client-side) ✓
- Task completions queue in `localStorage` key `pending-mutations[]`, drained on `online` event
- Muse requires network — input disabled with `// offline` status in sheet header
- Voice requires network — mic button disabled, tooltip `"offline"`

Day-1 scope: **skip the mutation queue.** Show a toast `"offline — reconnect to save"`. Add the queue in V1.1 if you actually lose a completion.

---

## 9 · Pre-allocated Behavioral Hooks

These cost nothing now and are expensive to retrofit. Build them in from the start.

### Last-opened tracking
On every app mount, read `localStorage.last_opened`, then write `now`. If `now - last_opened > 48h`, set `muse.reEntryPrompt = true`.

### Empty state as first-class
`<Board />` when `summary.every(p => p.top.length === 0)` renders `<EmptyState />` instead of an empty scroll area. EmptyState shows: last-completed task (pulled from today's vault conversations if available), one line — `"// AWAITING INPUT"` — and a large Muse-open CTA.

### Re-entry soft prompt
When `muse.reEntryPrompt === true`, the top of the board (above the first project card) shows one soft message row: Muse avatar dot + `"Been a couple days. What's on your mind?"` + mic glyph. Tap = open Muse sheet with mic armed. Ignore = it stays but doesn't nag. Clears itself after any Muse interaction.

### Haptic + audio on completion
On every task completion (via swipe, tap-check, or Pomodoro finish):
```js
navigator.vibrate?.(10);
playTaskCompleteSound();  // short two-note chirp, ported from V1
```

### Sunday recap
When Muse's first message of the day lands on a Sunday after 18:00 local (America/Detroit), her response includes a recap block. Logic lives in the `/api/chief` backend prompt, not frontend. Frontend just passes `firstTurnToday: true`.

---

## 10 · Build Sequence (authoritative order)

Per the council's revised sequence. Each day is a Claude Code session.

| Day | Deliverable | Verification |
|---|---|---|
| **1** | Vite + Preact scaffold, tokens.css, global.css, api.js, bare `<App />` that fetches `/api/backlog` and dumps the JSON into a `<pre>` | Dark cyberpunk background renders, JSON visible on screen, tokens load, three fonts show |
| **2** | Board read-only: TopBar + ProjectCard + TaskRow + HeartbeatDot, no interactions yet | Looks like the app, renders live data |
| **3** | Muse overlay + voice end-to-end: FAB → sheet → text input → mic → transcribe → /api/chief → execute actions → board re-fetches | Voice dump files a real task to the vault |
| **4** | Board interactions: tap check, cycle priority, tap launch (doesn't start timer yet, just logs) | All hand-interactions work |
| **5** | Focus surface + Ring: launch task runs full 25min work → 5min break cycle, audio + haptic on complete | Complete execution loop, task progress persists |
| **6** | PWA: manifest, sw.js, install to home screen, first day of real dogfood | Installed on phone, used for one real day |
| **7** | Dogfood day 2 + friction list → targeted fixes only | Validated as daily driver, ready to retire V1 |

**Scope stakes (immutable):**
1. Every feature must pass the surface/focus/check-off test
2. No new API endpoints in V2
3. Day 7 gate — installed on phone, one real day of use, or scope gets cut not extended

---

## 11 · File Tree (final)

```
v2/
├── index.html                 10-line shell, loads bundle
├── manifest.json              PWA manifest
├── sw.js                      Service worker
├── vite.config.js
├── package.json
│
├── public/
│   ├── icons/                 reuse existing
│   └── lionmaker.svg          the logo, for splash
│
└── src/
    ├── main.jsx
    ├── app.jsx
    ├── tokens.css             ALL design tokens
    ├── global.css             body, typography, ambient layer
    │
    ├── state/
    │   ├── board.js
    │   ├── timer.js
    │   └── muse.js
    │
    ├── lib/
    │   ├── api.js
    │   ├── voice.js
    │   └── heartbeat.js
    │
    └── components/
        ├── TopBar/
        │   ├── TopBar.jsx
        │   └── TopBar.css
        ├── Board/
        │   ├── Board.jsx            includes EmptyState inline
        │   ├── ProjectCard.jsx
        │   ├── TaskRow.jsx
        │   ├── HeartbeatDot.jsx
        │   └── Board.css
        ├── Focus/
        │   ├── Focus.jsx
        │   ├── Ring.jsx
        │   └── Focus.css
        └── Muse/
            ├── Muse.jsx             fab + sheet in one
            ├── MuseMessage.jsx
            ├── MuseInput.jsx        text + mic in one
            └── Muse.css
```

**23 files. ~2,000 lines target.** Half the code of V1, double the clarity.

---

## 12 · Anti-Patterns — Never

1. **No routing library.** Two surfaces, state toggle.
2. **No component library.** Preact + your own primitives.
3. **No Tailwind.** CSS variables + component-scoped styles.
4. **No TypeScript.** Single-operator codebase. Migrate later if regretted.
5. **No XP, levels, achievements, streaks, celebration overlays.** Rubin's rule: the dignity of the operator is in not being bribed to do his work.
6. **No narrative walls.** Muse is capped at 100 words.
7. **No emojis in UI text.** Glyphs only (▶ ✓ ● ↻).
8. **No modal that blocks the board.** Sheets slide up.
9. **No new API endpoints.** V2 is pure frontend.
10. **No light mode. Ever.**
11. **No project-management UI beyond the `+ NEW PROJECT` ghost-row.** Archive, rename, reorder, activate are voice-only via Muse. No long-press action sheets, context menus, settings panels, or bulk-edit modes. See Section 3a.

---

## 13 · Kill Criteria

V2 is failing if, after one week of real use:
- You open V1 instead of V2 for any reason → diagnose the gap
- You bypass Muse to file tasks manually → Muse's voice or flow is wrong
- You ignore the app entirely by day 3 → the core loop is wrong, deeper rethink

If any of those triggers, stop building features. Diagnose.

---

## 14 · Reference

- **V1 implementation**: `index.html` — the 3,500-line monolith. Aesthetic source of truth for ambient effects, ring geometry, audio, and mic behavior. V2 re-interprets this; does not replace its spirit.
- **Existing aesthetic contract**: `.claude/DESIGN.md` — V1-era design contract, still valid for ambient/effect specs.
- **Backend reference**: `CLAUDE.md`, `api/*.js` — unchanged in V2.
- **Vault source-of-truth**: `vault/projects/_registry.json`, `vault/projects/{id}/backlog.json` — never written by frontend directly; always through backend.

---

*End of DESIGN.md. Read before every session. Any drift from this document requires explicit approval.*

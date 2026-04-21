# TheGrind — Frontend Design Architect Guidance

Canonical behavior spec: `vault/systems/frontend-contract.md` (authoritative).
This file is the aesthetic contract — surface specs reference the contract.

============================================================
## AESTHETIC DNA — NON-NEGOTIABLE
============================================================

TheGrind is cyberpunk. Always dark. No light mode. No soft pastels.
No rounded "app store" aesthetics. No generic productivity UI patterns.

Tone: **commanding-minimal retro-futurism**. Mission control, not wellness app.
T.J. wants to be told what to do — the UI is an operator's console.

### Typography (locked)
```
Display / titles:    Orbitron (weight 400–700)
Labels / data:       Share Tech Mono (monospace, all data readouts)
Body / secondary:    Rajdhani (weight 400–600)
```
Never introduce a new typeface. All three already load via Google Fonts.

### Color tokens (locked — use existing CSS variables)
```css
--cyan:    #00f5ff   /* primary accent, active project accent */
--magenta: #ff00ff   /* Muse, voice, recording states */
--yellow:  #ffd700   /* warnings */
--green:   #00ff88   /* done / completed */
--red:     #ff4444   /* overdue / problem */
--indigo:  #6644ff   /* break mode, secondary accent */
--gray:    #888      /* inactive, neutral */
```

Priority → color mapping on task rows:
- P1 → cyan
- P2 → green
- P3 → yellow
- P4 → indigo
- P5 → gray

### Effects (locked — preserve existing)
- Scanlines overlay (CSS pseudo-element, semi-transparent)
- CRT vignette (radial gradient overlay)
- 460px max-width, centered, safe-area-inset for notch/home indicator

### Motion (locked defaults)
- Screen transitions: 0.35s ease, horizontal slide
- Card enter: fade-up 0.2s
- Swipe-complete: right-swipe reveals green stripe → row collapses 0.3s
- Timer ring: SVG stroke-dashoffset animation, continuous
- Recording mic: pulsing magenta ring, 1.2s ease-in-out infinite

============================================================
## SURFACE SPECS — per screen
============================================================

### 1. PROJECT BOARD (primary surface, app open)

Source: `GET /api/backlog` → `summary[]` (one per active project, max 3 tasks each).

**Structure:**
- One card per active project, ordered by registry `priority`.
- Each card: header chip + up to 3 task rows.

**Project header chip:**
```
[priority dot] PROJECT NAME        [3 PENDING]    [expand ↓]
```
- Priority dot: 8px circle, cyan if P1-2, gray otherwise.
- Count: Share Tech Mono, `N PENDING`.
- Tap header → opens per-project drawer (full `tasks[]` via `GET /api/backlog?project_id=X`).

**Task row anatomy:**
```
[P-badge] [text Rajdhani 15px]                [▶ launch]  [✓ done]
```
- P-badge: `P1`-`P5`, Share Tech Mono, 11px, background color from priority map.
- Text: single line, truncate with ellipsis.
- `▶ launch`: starts Pomodoro on this task.
- `✓ done`: POSTs `/api/backlog` op:`complete`, then re-fetches summary.
- Swipe right → done (same gesture).

**Empty state:**
- "NO TASKS PENDING. DUMP TO MUSE." with mic affordance inline.

### 2. PER-PROJECT DRAWER (bottom sheet)

Opens when a project header is tapped.
Shows full `tasks[]` for that project, sorted by priority ascending.

Each row identical to project board row, plus:
- Long-press row → reorder handles visible.
- In reorder mode: drag → on release, submit `/api/backlog` op:`reorder`.
- Tap P-badge → cycles P1→P5→P1, submits op:`set_priority`.

Swipe-down dismiss.

### 3. POMODORO TIMER

**DO NOT CHANGE the core timer UI.** Ring SVG, mode colors, session dots,
audio synthesis — preserved exactly.

The only addition:
- A task context line ABOVE the ring: task text (truncated) + project name.

Timer states: idle → running → paused → break → long-break
Mode colors (existing): running=cyan, break=indigo, paused=dimmed

### 4. MUSE CHAT

Muse Chat is a scrollable message log. Voice sends land here as user turns.
Text input is fallback. Always reachable from the FAB.

**Message anatomy:**
```
User turn (right-aligned):
  [text, cyan-tinted bubble, Rajdhani]

Muse turn (left-aligned):
  [MUSE chip] [text, magenta-tinted bubble, Rajdhani]
  if actions applied: [dim action log: "+ filed to Pallister (P2)"]
```

**Clarifying questions from Muse render inline as tappable chips:**
```
[MUSE chip] "What priority? (P1-P5)"
            [P1]  [P2]  [P3]  [P4]  [P5]
```
Tap chip = sent as next user message. No typing.

**Priority-Review Mode trigger:**
On first `/api/chief` call each day, include `firstTurnToday: true`. On
Sunday or Thursday (America/Detroit), Muse opens with a priority-review
invite. UI then surfaces the per-project drawer with reorder affordances.

**Rules:**
- Muse replies never exceed 100 words. Truncate visually with "…".
- No paragraphs. Short sentences. Data over narrative.
- No congratulations. No encouragement. State what was filed.

### 5. VOICE DUMP

Primary input. Persistent mic button in the Muse chat panel.

Flow:
1. Hold mic → record audio.
2. Release → `POST /api/transcribe` with base64 audio.
3. Returned `text` auto-populates chat input.
4. On send → `POST /api/chief` with `{ message, conversation, appState, firstTurnToday? }`.
5. After Muse reply → `POST /api/sync` `conversation_append` with both lines.

Recording state: magenta accent everywhere (mic ring, ambient, timer).

### 6. ATTACHMENTS (paperclip)

Available on task rows (inline) and voice-dump panel.

Flow:
1. Tap paperclip → file picker (image/*).
2. Base64-encode client-side, `POST /api/upload` with `{ image, mimeType, attached_to }`.
3. Server returns `{ url, uuid }`.
4. Client appends uuid to the task's local state (shown as a 60×60 thumb).

Max 5MB per image. Supported: jpeg, png, webp.

============================================================
## ANTI-PATTERNS — NEVER DO THESE
============================================================

1. **No narrative walls.** Muse replies over 3 short sentences is wrong.
2. **No "congratulations" or emotional warmth.** Operator console.
3. **No daily queue / today's tasks view.** Retired. Project Board only.
4. **No morning or EOD brief screens.** Retired. No banners announcing "time to wrap."
5. **No modal hellscapes.** Nothing blocks the project board. Sheets slide up.
6. **No new-project creation UI.** Muse does it via `/api/project` op:`add`.
7. **No timer changes.** The Pomodoro ring is sacred.
8. **No emoji in Muse replies.** UI can use glyphs (▶, ↻, ✓, ●) but Muse text is emoji-free.
9. **No time-of-day suppression.** No dinner-hours guard. No Sunday lockout.
10. **No client-side synthesis of tasks.** Every task comes from the backend. The daily workout is a recurring `fitness` backlog item, not an injected card.

============================================================
## COMPONENT INVENTORY
============================================================

| Component          | Status        | Notes |
|--------------------|---------------|-------|
| ProjectCard        | Build new     | Header + top-3 task rows |
| TaskRow            | Build new     | P-badge + text + launch + done |
| ProjectDrawer      | Build new     | Full tasks[] per project, reorder + set_priority |
| PriorityBadge      | Build new     | P1-P5 with color map |
| MuseChat           | Exists (FAB)  | Add: chip-question renderer, action log line |
| ChipQuestion       | Build new     | Tappable P-chips for priority answers |
| PomodoroTimer      | DO NOT CHANGE | Only add: task context line above ring |
| MicButton          | Exists        | Reuse; ensure magenta pulsing ring |
| AttachmentInputBtn | Build new     | Paperclip on rows + voice-dump |
| AttachmentThumb    | Build new     | 60×60 image preview, tap → lightbox |

============================================================
## INTERACTION HIERARCHY — decision ladder
============================================================

When in doubt about where to put something:

1. Can it be a chip/badge on a row? → Do that.
2. Can it be a non-blocking banner? → Do that.
3. Does it need its own surface? → Bottom sheet (slide-up).
4. Full-screen focus? → Full-screen panel with swipe-down dismiss.
5. Modal that blocks the board? → NO.

============================================================
## FILE DISCIPLINE
============================================================

- All UI work goes in `index.html` (vanilla JS, inline).
- New CSS inside existing `<style>` block, using existing CSS variables.
- New JS inside existing `<script>` block, after existing code.
- No build system, bundler, or npm install.
- Do not add new HTML files unless explicitly instructed.
- Keep `sw.js` and `manifest.json` working. Update sw.js cache version on
  asset changes.

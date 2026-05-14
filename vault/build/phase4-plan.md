# TheGrind V2 — Phase 4 Onboarding Plan

**Branch:** `v2-phase4` (cut from `main @ 73c7dd2`)
**Model for Phase 4 implementation:** Opus 4.7 (sequential, no parallelism per PHASES.md — new surface with cross-imports).
**Status:** Plan approved with answers 2026-04-21. Not yet committed. Gate 2 (extraction prompt) pending review.

---

## Context

Phase 3 shipped the voice loop: Muse FAB → mic → transcribe → chief → tool call → vault write. Phase 4 adds the *other* voice-first surface: first-run onboarding. New users (or existing users adding projects) answer three questions by voice, Opus 4.7 extracts a structured project + task list from the combined transcript, the user reviews/edits, then commits with **LOCK IT IN**.

Problem this solves: Board empty state has nowhere to go. Users can file tasks via Muse but there's no first-run path to *populate projects*. Onboarding bootstraps the vault.

Intended outcome: in ~3 minutes of voice input, a user's brain dump becomes a clean list of projects + P1–P3 tasks in `_registry.json` + per-project `backlog.json` files, exercised via existing `/api/project` (op: `add`) and `/api/backlog` (op: `add`) endpoints — **no new `/api/*` exception required**. The `chief.js` mode branch for `mode: 'onboard'` is covered by existing exception #3 (mode routing + prompt caching) per owner ruling.

---

## Mockup audit (screens 16–21)

**Files identified:** `16-onboard-intro.html` through `21-onboard-review.html`. Six screens.

**Per-screen:**
- **16 intro** — full-screen takeover (`.onboard.intro`, inset:0, z-index 20). Hero Lionmaker logo 96px (`hero-pulse` 3s ease-in-out), "THEGRIND" wordmark (Orbitron 1.9rem, 8px letter-spacing), tagline "// A LIONMAKER SYSTEM", copy "Three questions. Answer out loud.", cyan glyph-only ▶ play button (120×64, chamfered, cyan fill, no magenta border). Static.
- **17 Q1 asking** — "ONBOARDING · 1/3" status pill. Muse header (avatar 32px, listening dot magenta). Question bubble: "What projects are you running right now?". Armed mic (96×96, magenta gradient, `mic-pulse` 1.6s). Hint: "Hold to speak — release when done".
- **18 Q1 recording** — "ONBOARDING · 1/3 · LISTENING". `.transcript-inline` (cyan **dashed** 1px border 88% width, live caret `caret-blink` 1s steps(2)). Mic escalates: `mic-pulse` 0.8s + ring-expand pseudo-element 1.4s ease-out. Timer "0:12 LISTENING...".
- **19 Q2 asking** — standard scrolling conversation (question → Q1 answer bubble → Q2 question), stacked at full fidelity like the Muse sheet from Phase 3. **No compression treatment.** (Note: earlier plan draft referenced `.q2-history` / `.q2-current` compression — owner confirmed this isn't in the actual mockups; removed.) "ONBOARDING · 2/3".
- **20 parsing** — Q3 question + user answer shown in conversation. `.parsing-spinner` 32px `spin` 1s linear infinite. `.parsing-dots` three 6px dots `parse-dot` 1.2s staggered .15s/.3s. Label "// PARSING INPUT".
- **21 review** — Board-like layout, topbar status "SETUP". Three project panels. Per-task: text + P1/P2/P3 badge + ✎ edit + × delete. Overdue example "⚡ 14+ DAYS OVERDUE". Pinned `.lock-dock` (absolute bottom, z-index 40, gradient fade rgba(10,10,18,0)→.98) with full-width cyan "LOCK IT IN ▶" button 56px chamfered. Eyebrow: "➤ // HERE'S WHAT I FILED. FIX ANYTHING THAT'S WRONG."

**Flow:** 16 → 17 → 18 → (auto-advance on mic release + transcription) → 19 → (Q2 record, extrapolated from Q1 pattern) → (Q3 ask, extrapolated) → (Q3 record, extrapolated) → 20 parsing → 21 review → commit.

**Mockup gaps (Q2-recording, Q3-asking, Q3-recording):** owner approved extending the Q1-recording pattern faithfully. Stack bubbles in a scroll container (Muse-sheet style). Each new question appends to the scroll. No history compression.

**Transcript bubble state transition (owner correction):** during recording the transcript bubble shows **cyan dashed** border (live/temporary). On mic stop + Whisper finalize, dashed → **solid cyan** border. That solid bubble is the answer of record and persists in the scrolling conversation as the user moves to Q2. Same DOM element, border-style transition on state change (`.transcript-inline.finalized` variant).

**Footer status indicator (owner decision 2026-04-21):** absolute-positioned footer inside the onboard surface on screens 17–20 (and parsing/review states). Dim gray, Orbitron mono. **No numerator.** "1/3" progress already lives in the status pill at the top of each screen. Format per state:

| State | Footer text |
|---|---|
| `q1-ask` | `Q1 · MIC ARMED` |
| `q1-record` | `Q1 · RECORDING` |
| `q2-ask` | `Q2 · MIC ARMED` |
| `q2-record` | `Q2 · RECORDING` |
| `q3-ask` | `Q3 · MIC ARMED` |
| `q3-record` | `Q3 · RECORDING` |
| `parsing` | `PARSING` |
| `review` | `REVIEW` |

**New tokens/components in Phase 4 CSS:**
- `.onboard.intro` full-screen takeover flex layout
- `.transcript-inline` (cyan dashed → solid border + live caret)
- `.parsing-spinner` / `.parsing-label` / `.parsing-dots`
- `.lock-dock` (absolute-bottom pinned CTA with backdrop gradient)
- `.btn-primary.glyph-only` (120×64 cyan play variant)
- Onboarding footer caption element

All colors/type reuse existing tokens. Orbitron/Rajdhani/Share Tech Mono, t-xs..t-2xl scale, cyan/magenta/yellow palette.

**Motion budget (every animation):**
- `hero-pulse` 3s ease-in-out
- `mic-pulse` 1.6s armed / 0.8s recording (reused from Phase 3)
- Ring-expand pseudo-element 1.4s ease-out on `.big-mic.recording::before`
- `caret-blink` 1s steps(2) infinite
- `parse-dot` 1.2s ease-in-out infinite, staggered .15s/.3s
- `spin` 1s linear infinite

All CSS-native. No SVG morphing, canvas, or JS-driven animation. No libraries.

**Ambiguities being resolved by owner decisions and future design batch:**
- Error states (transcription fail, empty extraction, partial commit) — handled by state machine; visual polish deferred to design batch.
- No back/skip on 16–20 — resolved: × close on 17–20 only (not intro 16) with confirm modal "Exit onboarding? Your answers will be lost." keep/exit buttons.
- Edit UX, category chip interaction — resolved (see item 6).
- Category → color header map — deferred to Phase 5. Phase 4 uses **neutral-gray** project panel headers.
- Q2/Q3 recording layout — resolved: standard scrolling conversation, no compression.

---

## Code audit — reuse map

| Component | File | Reuse status |
|---|---|---|
| `voice.js` MediaRecorder wrapper | `v2/src/lib/voice.js` (109L) | **Reuse as-is.** Call `startRecording()` 3× sequentially. No refactor. |
| `api.js` transport | `v2/src/lib/api.js` (93L) | **Reuse as-is.** `postChief({ mode: 'onboard', ... })` already wired. |
| `muse.js` state patterns | `v2/src/state/muse.js` (243L) | **Template only.** New `onboard.js` store mirrors shape. Muse store untouched. |
| `chief.js` mode routing | `api/chief.js` (291L) | **Branch, don't rewrite.** Add onboard branch at lines 56–58 (persona), 73–182 (tools), 184–187 (context). Covered by existing exception #3. |
| `/api/project.js` op: add | `api/project.js` (184L) | **Reuse as-is.** Full-featured. No new endpoint. |
| `/api/backlog.js` op: add | `api/backlog.js` | **Reuse as-is.** Per-task after project creation. |
| Vault shape | `vault/projects/_registry.json` + per-project `backlog.json` | **Reuse as-is.** |
| Categories (7) + priorities (1–5) | `api/chief.js:15` + `vault/systems/muse-system.md:57–62` | **Reuse as-is.** |

---

## The plan, by item

### 1. Entry point

Mockup 16 is a **full-screen takeover** (`position: absolute; inset: 0; z-index: 20`) — replaces Board. Implement as:

- New top-level `<Onboard />` in `app.jsx` as **sibling** of `<Board />`, not nested.
- Mount condition: `onboard.isActive === true` in the onboarding store.
- Auto-activate on first load when `/api/backlog` returns zero active projects.
- Manual entry: Board empty-state "+ NEW PROJECT" CTA sets `onboard.isActive = true`. Re-runnable for existing users.
- **Close affordance:** × top-right on screens 17–20 (not intro 16). Tap opens confirm modal: "Exit onboarding? Your answers will be lost." with two buttons (keep / exit). Exit → `onboard.isActive = false`, answers discarded, Board mounts. Keep → modal closes, user continues where they left off.
- On LOCK IT IN success → `isActive: false` → Board re-fetches registry → shows newly-created projects.

### 2. State shape (`src/state/onboard.js`)

New nanostore, ~150 lines. Serial, no parallelism complexity.

```js
{
  isActive: false,
  step: 'intro',
  // 'intro'|'q1-ask'|'q1-record'|'q2-ask'|'q2-record'|'q3-ask'|'q3-record'|'parsing'|'review'|'committing'|'done'|'error'
  answers: {
    q1: { transcript: '', durationSec: 0, finalized: false },
    q2: { transcript: '', durationSec: 0, finalized: false },
    q3: { transcript: '', durationSec: 0, finalized: false }
  },
  // Conversation as rendered in scroll container on q2-ask/q3-ask.
  // Muse question bubbles + user answer bubbles, stacked top-to-bottom.
  // Each user bubble starts dashed (finalized: false) during recording,
  // flips to solid (finalized: true) once Whisper transcription returns.
  conversation: [],   // [{ role: 'muse'|'user', text, finalized }]
  // Active-recording scratch
  isRecording: false,
  isTranscribing: false,
  recordingStartedAt: null,
  // Extraction output from Opus tool call
  extracted: {
    projects: []   // [{ tempId, name, category, priority, note, tasks: [{ tempId, text, priority, category }] }]
  },
  // User edits on the review screen. Defaults to extracted on entry;
  // mutated in place as user edits.
  reviewed: null,
  // Commit progress during LOCK IT IN
  commit: { total: 0, completed: 0, failed: [] },
  // Confirm-exit modal
  confirmExit: false,
  // Errors (transcription fail, extraction fail, partial commit)
  error: null
}
```

**Valid transitions:**

```
intro → q1-ask                     (user taps ▶)
q1-ask → q1-record                 (user presses mic)
q1-record → transcribing           (release)
transcribing → q2-ask              (Whisper returns, answers.q1 finalized, conversation appended)
q2-ask → q2-record → transcribing → q3-ask
q3-ask → q3-record → transcribing → parsing
parsing → review                   (Opus returns extracted.projects.length > 0)
parsing → error                    (Opus fails or returns zero projects)
review → committing                (user taps LOCK IT IN)
committing → done                  (all projects + tasks written)
committing → error                 (any endpoint fails; holds partial state)
error → review                     (user retries with same extracted data)
error → intro                      (user taps "START FRESH", answers cleared)
done → isActive:false              (Board mounts, re-fetches registry)
any step 17–20 → confirmExit:true  (user taps ×)
confirmExit:true → isActive:false  (user taps "Exit") — answers cleared
confirmExit:true → resume          (user taps "Keep")
```

**Error recovery:**
- Transcription fail per question → return to `q{N}-ask` with banner ("Couldn't hear that — try again"). Don't lose prior answers.
- Mic reacquire fail on Q2/Q3 (`getUserMedia()` throws after backgrounded tab) → banner "Tap to grant mic access again" on the `q{N}-ask` screen. Retry grabs permission.
- Extraction fail (Opus error or zero projects) → `error` state with 3-answer transcript collapsed panel + RETRY and START FRESH buttons.
- Partial commit (project 3 of 5 fails) → show committed vs. uncommitted. User retries failed, or edits and retries. Don't roll back successes.

### 3. Voice capture reuse

Reuse `voice.js` as-is. Three sequential `startRecording()` calls. Mic release-and-reacquire between questions is fine per owner. Graceful handling if reacquire fails (item 2 error path).

### 4. Extraction tool

Anthropic tool-use, `extract_onboarding` tool, single call per extraction. Schema:

```js
{
  name: 'extract_onboarding',
  description: 'Extract a clean list of projects and top-priority tasks from the raw transcript of a 3-question voice interview. Call exactly once.',
  input_schema: {
    type: 'object',
    required: ['projects'],
    properties: {
      projects: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'priority', 'tasks'],
          properties: {
            name: { type: 'string' },
            category: { type: 'string', enum: ['In Business','On Business','Health','Family','Finances','Personal','Learning'] },
            priority: { type: 'integer', minimum: 1, maximum: 5 },
            note: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['text', 'priority'],
                properties: {
                  text: { type: 'string' },
                  priority: { type: 'integer', minimum: 1, maximum: 5 },
                  category: { type: 'string', enum: ['In Business','On Business','Health','Family','Finances','Personal','Learning'] }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Response parsing: reuse tool_use block handling from `chief.js:253–261`. Zero projects → error state.

### 5. Extraction prompt

Written in final form at `vault/systems/onboard-system.md` on go-ahead (last revision pasted inline in Gate 2 reply 2026-04-21).

**Prompt-caching implementation checklist (for chief.js onboard branch):**
- Stable cached prefix = system text (onboard-system.md contents) + `extract_onboarding` tool schema. Dynamic tail = the 3-answer transcript.
- Attach `cache_control: { type: 'ephemeral' }` to the LAST element of the stable prefix (i.e. tool schema block or final system block), marking everything up through that point as cacheable. Dynamic transcript comes AFTER the cache boundary.
- Verify cached prefix ≥ 1024 tokens minimum for Anthropic cache activation. onboard-system.md is ~500 tokens; tool schema ~300 tokens; combined with system-message wrapping this should clear 1024 but measure on first call.
- Log `cache_read_input_tokens` and `cache_creation_input_tokens` from the Anthropic response on first onboarding call. If cache_read stays 0 across multiple onboarding calls, investigate (prefix too short, or cache_control placement wrong).
- Reuse Phase 3 caching pattern from `chief.js` Muse branch — same `cache_control` mechanism, different prefix content.

### 6. Review surface

Mockup 21 → implementation, with owner corrections:

- Topbar reuses existing `<TopBar />` with a "SETUP" status variant.
- Scrollable project panels with **neutral-gray headers** (category → color deferred to Phase 5).
- New `<OnboardProject />` per project, `<OnboardTaskRow />` per task.
- `.lock-dock` pinned bottom with gradient fade.

Resolving edit UX:
- **Tap ✎** → inline contenteditable edit, save on blur.
- **Tap category chip** → native `<select>` dropdown with the 7 options (iOS Safari tap-friendly).
- **Priority reorder** → up/down chevrons on P1/P2/P3 badges (no drag on iOS).
- **Tap ×** → single-tap delete (red tint on press). No undo.
- **Per-project + ADD TASK** row at bottom.
- **+ ADD PROJECT** button above lock-dock. Creates empty-named project card with focus.
- Empty project panel (zero tasks) uses a placeholder row visible to owner; design pass later.

### 7. LOCK IT IN commit

Sequential single-create calls via existing `/api/project` op: `add` and `/api/backlog` op: `add`. No new `/api/*` exception.

- Projects first (registry updates), then tasks per project.
- Do not parallelize — `_registry.json` is a single file.
- Progress shown inline: "Locking in Pallister (2 of 5)...".
- Failure: partial-commit banner with retry affordances.

### 8. Playwright test

New spec `v2/tests/onboard-flow.spec.js`. Mock:
- `MediaRecorder` (Phase 3 pattern, synthesized Blob)
- `POST /api/transcribe` (canned per-question fixtures)
- `POST /api/chief` mode=onboard (canned tool_use block with 3 projects, 6 tasks)
- `POST /api/project` + `/api/backlog` (`{ ok: true }`)

Coverage:
1. Happy path: intro → Q1 → Q2 → Q3 → parsing → review → LOCK IT IN → done
2. Review edits: rename project, change priority, delete task, add task — verify final commit payload
3. Empty extraction: zero projects → error state with RETRY / START FRESH
4. Transcription fail on Q2: return to q2-ask with banner
5. Partial commit fail (project 3 of 5 500s): partial-commit banner with retry

### 9. Bundle impact estimate

Phase 3 baseline: 11.38 KB JS gz, 4.26 KB CSS gz. Budget: 50 / 20 KB gz.

Projected Phase 4 delta:
- `state/onboard.js` — ~1.0 KB gz
- `components/Onboard/*` (~5 JSX files + subcomponents) — ~3.5 KB gz
- `components/Onboard/*.css` — ~2.0 KB gz

**Total projection:** ~16 KB JS gz (budget 50 — 32 KB headroom), ~6.3 KB CSS gz (budget 20 — 13.7 KB headroom). Well under budget. Trigger for flag: JS delta > +7 KB after first build.

### 10. Mockup fidelity budget

Layout, type, color, motion all 100% achievable in vanilla CSS. Every animation is CSS-native `@keyframes` with standard properties. No libraries needed. One new button variant (`.btn-primary.glyph-only`, ~20 lines CSS).

Footer status indicator format locked per item 10 / owner decision above — no numerator, state-keyed labels only.

---

## Implementation sequence (sequential, no fan-out)

1. `vault/systems/onboard-system.md` — extraction prompt (see Gate 2).
2. `api/chief.js` — branch on `mode: 'onboard'` (persona, tools, context). Show diff before commit (covered by exception #3).
3. `src/state/onboard.js`.
4. `src/components/Onboard/` — intro, Q-asking (scrolling conversation), Q-recording (transcript bubble dashed → solid on finalize), parsing, review subcomponents + CSS. Confirm-exit modal.
5. `app.jsx` wire-up + Board empty-state hand-off.
6. `v2/tests/onboard-flow.spec.js`.
7. Build, bundle check, lint.
8. Preview deploy + iPhone phone test.
9. PHASES.md entry + merge.

Each step commits end-to-end-working output. No partial-infrastructure commits.

---

## Verification

- **Unit/E2E:** `npm --prefix v2 test` — all green
- **Bundle:** `npm --prefix v2 run build` — record gz deltas, enforce budget
- **Lint:** green before commit
- **Desktop visual:** incognito (V1 SW ghost), match screens 16–21 to mockups
- **Phone test (required per Pattern 3):** iPhone Safari against preview URL, real mic + Whisper + Opus + vault writes. Catches iOS-specific bugs (safe-area, mic permission, tap-vs-hold feel).
- **Post-phase:** PHASES.md entry with commits, bundle, exceptions, patterns, polish punch list.

---

## Design asks batched for Claude Design (future ask, not this phase)

- Q2-recording, Q3-asking, Q3-recording screens (extrapolated Phase 4 implementation, refine later)
- Error states: transcription fail, empty extraction, partial commit
- Exit confirmation modal
- LOCK IT IN committing / done states
- Edit-mode treatment for tasks on review screen
- Empty project panel (zero tasks)
- Category → color mapping for project headers (Phase 5 decision)
- Board polish items from Phase 3 phone test (task wrap, FAB reach, EXECUTE glyph, project name truncation)

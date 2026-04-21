# TheGrind V2 — Build Log

Authoritative record of phase-by-phase state, approved exceptions, and patterns
observed during the rebuild. Read this file first in any new Claude Code
session before touching code.

## Current state

- **Main HEAD:** check `git log main --oneline -1`
- **Production:** `the-grind-gold.vercel.app` — single Vercel project
- **Architecture:** V2 served at `/` via Vite build at `v2/dist/`, `/api/*`
  same-origin, all Vercel serverless functions
- **Lighthouse accessibility:** 100/100 (Phase 2 close)

## Stack lock (non-negotiable)

- **Frontend:** Preact + Vite + nanostores + vanilla CSS
- **Backend:** Vercel serverless functions, ESM throughout, Node 18+
- **Models:** Anthropic (Sonnet 4.6 + Opus 4.7), Groq Whisper for transcription
- **Forbidden:** React, TypeScript, Tailwind, CSS-in-JS, component libraries,
  routers, state libraries other than nanostores, animation libraries, audio
  libraries, WebSocket libraries

## API rules

`/api/*` and `/vault/*` are frozen by default. Exceptions require explicit
user approval and a "show me the diff" review before any commit.

### Approved exceptions

1. **`api/backlog.js` summary includes `last_touched`** (Phase 1, commit
   `533dafe`) — needed for heartbeat dot rendering.
2. **Root `package.json` `"type": "module"`** (Phase 1, commit `ee443bd`) —
   prevented Vercel's ESM→CJS compilation from silently breaking
   `import.meta.url` in serverless functions.
3. **`api/chief.js` mode routing + prompt caching + logging** (Phase 3) —
   explicit per-intent model routing, Anthropic prompt caching on stable
   system head, per-request JSON logs for observability.
4. **`api/backlog.js` + `api/chief.js` GET handlers read from GitHub**
   (Phase 3, commit `9ec8f31`) — closes read-after-write consistency bug
   where GET handlers read from the bundled vault snapshot (frozen at deploy)
   while POST handlers wrote to GitHub directly. Muse-filed tasks were
   invisible until next deploy. See Pattern 1.

## Model routing (locked)

```js
// api/chief.js
const MODELS = {
  muse:    'claude-sonnet-4-6',   // daily voice loop (Phase 3)
  onboard: 'claude-opus-4-7',     // multi-project extraction (Phase 4)
  recap:   'claude-opus-4-7',     // weekly review (later)
  default: 'claude-sonnet-4-6'
};
```

Frontend sends `mode` per intent. No auto-escalation. Prompt caching mandatory
on the stable system head (persona + APP_CONTEXT_PROMPT + tools).

## Muse store shape (locked, Phase 3)

```js
{
  isOpen,
  messages,          // [{ id, role: 'user'|'muse'|'action', content, ts, variant? }]
  isRecording,
  isTranscribing,    // audio → text
  isSending,         // text → chief response
  isOnline,
  voiceText,
  status,            // 'idle'|'listening'|'transcribing'|'thinking'|'response'|'error'|'offline'
  lastAction,
  lastActionAt,
  prefill
}
```

## Heartbeat thresholds (DESIGN.md §4)

| Age           | Color          | Animation            |
| ------------- | -------------- | -------------------- |
| `null`        | dim gray       | none                 |
| 0–3 days      | green          | none                 |
| 3–7 days      | yellow         | none                 |
| 7+ days       | red            | 2s ease-in-out pulse |

## Parallelism rules

- **Default:** sequential single Sonnet session
- **Allowed fan-out:** CSS after structural JSX (Phase 2), onboarding mockup
  fidelity (Phase 4), Ring SVG port (Phase 6), PWA assets vs SW (Phase 7),
  test-writing, visual QA
- **Forbidden:** Phase 1, Phase 3 voice loop, Phase 8 polish, any state store
  authoring, any files with cross-imports
- **Fan-out protocol:** ephemeral sub-branches, Opus integrates single commit,
  no force-pushes, each Sonnet verifies `git rev-parse --abbrev-ref HEAD` +
  clean tree before starting

## Phase history

### Phase 0 — Prep
Deleted V1 monolith. Kept `/api/`, `/vault/`, `/design/mockups/`, `/vercel.json`.
Known ghost: V1 service worker still haunts browsers that installed the PWA.
Clear manually via DevTools → Application → Service Workers → Unregister.

### Phase 1 — Foundation scaffold (merged)
Scaffold renders live `/api/backlog` JSON in `<pre>` block. Single Vercel
project, V2 at `/` via `buildCommand: "cd v2 && npm install && npm run build"`.

### Phase 2 — Board read-only (merged)
Bundle: 7.99 KB JS gz + 3.14 KB CSS gz. Three states: default, empty, offline.
Re-entry deferred to Phase 3. DESIGN.md §4 patched with null-heartbeat rule.

### Phase 2 a11y cleanup (merged)
Lighthouse a11y 87 → 100. aria-labels, landmarks, focus-visible rings,
text-muted alpha 30 → 60%, text-dim alpha 55 → 60%, maximum-scale=1 removed,
pseudo-element focus ring on clipped EXECUTE button.

### Phase 3 — Voice loop (in progress, close to merge)
Muse FAB → sheet → mic → transcribe → chief → tool call → vault write →
Board re-fetch. Validated on iPhone: voice → task on Board in <10s, Muse
in character, Sonnet 4.6 handling intent mapping correctly. Commits:
- Commit 1: `/api/chief.js` mode routing + prompt caching + logging
- Commit 2: full frontend voice loop with Playwright E2E
- Commit 3: `/api/*` GET handlers read from GitHub (read-path consistency)

## Phase roadmap

- **Phase 4 — Onboarding.** 3-question voice flow → Opus 4.7 extraction →
  Review → LOCK IT IN. Uses `mode: 'onboard'`.
- **Phase 5 — Board interactions.** Check-off, priority cycle, launch to
  Focus, ghost-row wiring.
- **Phase 6 — Focus surface + Ring timer.** Port sacred SVG from mockup 06.
- **Phase 7 — PWA manifest + service worker + iOS install.** Killswitch SW
  to clean up V1 ghost.
- **Phase 8 — Dogfood + polish.** V2 already live at `/`; Phase 8 is real
  use + polish items accumulated from phone tests.

## Patterns observed during the build

### Pattern 1 — `/api/*` frozen rule keeps surfacing pre-existing bugs

Four approved exceptions so far (see list above). None are scope creep; all
are V1 bugs that had been silently broken. The frozen rule did its job by
forcing explicit review of each backend touch, which surfaced the bugs
instead of letting them compound.

**Implication:** Expect more of these in Phases 4-7 as new surfaces exercise
the backend. Budget 1-2 small `/api/*` exception commits per phase.
Don't treat them as scope drift.

### Pattern 2 — Environment variable corruption is common

Three env var bugs to date:
1. `GITHUB_TOKEN` trailing newline (pre-build)
2. `GROQ_API_KEY` branch-scoped to stale branch (Phase 3)
3. `ANTHROPIC_API_KEY` literal `\n` characters baked into value (Phase 3)

**Root cause:** Copy-paste into Vercel's dashboard or CLI introduces invisible
corruption. Trailing whitespace, literal `\n` encoding, scope mismatches.
Bugs don't surface until the API call fails with a confusing error.

**Mitigation:** Run `scripts/verify-env.js` any time a key is rotated, a
new branch is deployed, or a confusing auth error appears.

### Pattern 3 — The phone test is irreducible

Every material bug in Phase 3 was caught by the real-device phone test, not
by desktop testing, Playwright mocks, or code review:
- iOS MediaRecorder mime mismatch (Groq rejected mp4)
- Groq env var scope bug
- Anthropic env var `\n` corruption
- Read-after-write consistency bug

**Rule:** Every Phase 4-8 requires a real-device phone test against the
preview URL before merge. No exceptions. Desktop Playwright green is
necessary but not sufficient. Budget 10-15 min of user attention per
phase gate.

**Polish punch list:** Every friction point noticed during a phone test
goes on a post-phase polish list. Don't ignore — polish debt compounds.

Known polish items from Phase 3 phone test:
- iOS EXECUTE button renders `▶` as emoji, not text glyph
  (fix: `font-variant-emoji: text` or inline SVG)
- Muse FAB is hard to reach with left-hand thumb at 56px
  (consider 64-72px or pull-up gesture)
- Task text truncation too aggressive — user can't read full task on single
  line. Needs wrap or expand-on-long-press in Phase 5 UX polish.
- Long project names truncate (e.g. LIONMAKER KETTLEBELL APP → KETTLEBEL...).
  Lower severity — project name is identifier, full text is in individual
  tasks.

## Critical rules (repeat for every Claude session)

- **"Show me the diff"** for any `/api/*` change
- **Bundle budget enforced:** JS < 50 KB gz, CSS < 20 KB gz, reported after
  every commit
- **Stop-and-ask** on stack drift, new UI surfaces, new files outside the
  approved tree, any `/api/*` or `/vault/*` changes
- **No force-pushes. Ever.**
- **No partial-infrastructure commits** — phases either work end-to-end at
  commit time or the commit isn't made
- **Opus reviews** at critical-path gates and parallel integrations
- **Incognito browser** for visual verification (V1 service worker ghost is real)
- **Phone test required** at Phase 4-8 gates

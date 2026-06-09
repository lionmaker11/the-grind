// Pomodoro timer store — Phase 6. Implements DESIGN.md §state/timer.js
// with the Phase-6 'select' mode addition (at-launch pomodoro picker,
// per the Council 3 relocation of pomo estimates from planning state
// to session state — see phase6-spec.md D1/D4).
//
// Drift-free ticking: timeLeft derives from a wall-clock endTimestamp,
// recomputed every 250ms while running (setInterval drift doesn't
// accumulate; backgrounded tabs catch up on the next tick). Pause
// stores the remaining seconds and clears endTimestamp; resume
// recomputes endTimestamp from the stored remainder.
//
// Persistence: full session state serialized to localStorage
// (grind-timer-v1) on every store change. Module-load hydration
// restores the session after reload / PWA relaunch; segments that
// expired while away are completed in sequence (catch-up chain), so
// returning after 40 minutes mid-work lands you in the RIGHT segment,
// not a stale one.
//
// Segment chain (D3): work(25:00, cyan) → sessionPomos < plannedPomos
// ? break(05:00, green) → work … : long-break/REBOOT(15:00, magenta)
// → idle (session complete, back to Board).

import { map } from 'nanostores';

export const DURATIONS = {
  work: 25 * 60,
  break: 5 * 60,
  'long-break': 15 * 60
};

const STORAGE_KEY = 'grind-timer-v1';
const TICK_MS = 250;

const IDLE_STATE = {
  mode: 'idle', // idle | select | work | break | long-break
  timeLeft: 0,
  totalTime: 0,
  running: false,
  endTimestamp: null,
  currentTask: null, // { id, text, project_id, project_name }
  pomosCompleted: 0, // lifetime-ish counter (today-scope deferred)
  sessionPomos: 0,   // completed work segments this session
  plannedPomos: 0    // picked at launch (1-4)
};

export const timerStore = map({ ...IDLE_STATE });

let tickInterval = null;

// ─── persistence ─────────────────────────────────────────────────────

function persist() {
  try {
    const s = timerStore.get();
    if (s.mode === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode quota etc.) — session just
    // won't survive reload; everything else works.
  }
}

function patch(keys) {
  timerStore.set({ ...timerStore.get(), ...keys });
  persist();
}

// ─── segment helpers ─────────────────────────────────────────────────

function nextSegmentAfterWork(state) {
  // The completed work segment was already counted into sessionPomos
  // by the caller.
  return state.sessionPomos >= state.plannedPomos ? 'long-break' : 'break';
}

function startSegment(mode, { autoRun = true } = {}) {
  const total = DURATIONS[mode];
  patch({
    mode,
    timeLeft: total,
    totalTime: total,
    running: autoRun,
    endTimestamp: autoRun ? Date.now() + total * 1000 : null
  });
  syncTicker();
}

// Segment finished (timeLeft hit 0 or user skipped forward). Work
// segments count toward the session; break/reboot don't. Returns the
// mode entered (or 'idle' when the session completes).
function completeSegment({ silent = false } = {}) {
  const s = timerStore.get();
  if (!silent) feedback();

  if (s.mode === 'work') {
    const sessionPomos = s.sessionPomos + 1;
    patch({
      sessionPomos,
      pomosCompleted: s.pomosCompleted + 1
    });
    const next = nextSegmentAfterWork(timerStore.get());
    startSegment(next);
    return next;
  }

  if (s.mode === 'break') {
    startSegment('work');
    return 'work';
  }

  if (s.mode === 'long-break') {
    // REBOOT finished — session complete. Back to idle; Focus view
    // unmount is the caller's concern (exitToBoard from the UI, or
    // App render switch reacting to focusStore — see Focus.jsx).
    exitSession();
    return 'idle';
  }
  return s.mode;
}

// ─── ticking ─────────────────────────────────────────────────────────

// Walk expired segments forward, re-anchoring each new segment's
// endTimestamp to the moment the previous one actually ended (NOT
// Date.now() — startSegment anchors to now, which would gift away-time
// back to the user). Shared by the live tick (backgrounded tab waking
// after several segment durations — Codex P2) and hydration (reload
// after time away). `silent` suppresses per-segment feedback for the
// stale chain; the live path beeps once up front for the segment that
// just visibly completed.
function catchUpExpiredSegments({ silent }) {
  let guard = 0;
  while (guard++ < 16) {
    const s = timerStore.get();
    if (s.mode === 'idle' || !s.endTimestamp) return;
    const remaining = Math.ceil((s.endTimestamp - Date.now()) / 1000);
    if (remaining > 0) {
      patch({ timeLeft: remaining });
      return;
    }
    const expiredEnd = s.endTimestamp;
    const entered = completeSegment({ silent });
    if (entered === 'idle') return;
    const cur = timerStore.get();
    patch({ endTimestamp: expiredEnd + cur.totalTime * 1000 });
  }
}

function tick() {
  const s = timerStore.get();
  if (!s.running || !s.endTimestamp) return;
  const remaining = Math.ceil((s.endTimestamp - Date.now()) / 1000);
  if (remaining <= 0) {
    // Feedback once for the visible completion; any further expired
    // segments in the chain (long background) advance silently.
    feedback();
    catchUpExpiredSegments({ silent: true });
    syncTicker();
    return;
  }
  if (remaining !== s.timeLeft) {
    patch({ timeLeft: remaining });
  }
}

function syncTicker() {
  const s = timerStore.get();
  const shouldTick = s.running && s.endTimestamp != null;
  if (shouldTick && !tickInterval) {
    tickInterval = setInterval(tick, TICK_MS);
  } else if (!shouldTick && tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ─── actions ─────────────────────────────────────────────────────────

// Launch from Board (▶ / EXECUTE). Same-task launch while a session is
// already active resumes the existing session view (no state change);
// different-task launch replaces the session (D6 — deliberate action,
// no confirm).
export function launch(task) {
  const s = timerStore.get();
  if (
    s.mode !== 'idle' &&
    s.currentTask &&
    task &&
    s.currentTask.id === task.id
  ) {
    return; // same task — re-entering the running session
  }
  patch({
    ...IDLE_STATE,
    pomosCompleted: s.pomosCompleted, // survives session replace
    mode: 'select',
    currentTask: task
      ? {
          id: task.id,
          text: task.text || '',
          project_id: task.project_id || null,
          project_name: task.project_name || ''
        }
      : null
  });
  syncTicker();
}

// Picker tap (D4): single tap on glyph N starts the session.
export function startWork(plannedPomos) {
  const n = Math.max(1, Math.min(4, parseInt(plannedPomos, 10) || 1));
  patch({ plannedPomos: n, sessionPomos: 0 });
  startSegment('work');
}

export function pause() {
  const s = timerStore.get();
  if (!s.running || s.endTimestamp == null) return;
  const remaining = Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
  patch({ running: false, endTimestamp: null, timeLeft: remaining });
  syncTicker();
}

export function resume() {
  const s = timerStore.get();
  if (s.running || s.mode === 'idle' || s.mode === 'select') return;
  patch({
    running: true,
    endTimestamp: Date.now() + s.timeLeft * 1000
  });
  syncTicker();
}

// ⏭ — advance to the next segment now. A skipped work segment COUNTS
// (done-early semantics, D5). Skipping break/reboot just moves on.
export function skip() {
  const s = timerStore.get();
  if (s.mode === 'idle' || s.mode === 'select') return;
  completeSegment({ silent: true });
}

// ↻ — restart the current segment at full duration, preserving
// running/paused state.
export function reset() {
  const s = timerStore.get();
  if (s.mode === 'idle' || s.mode === 'select') return;
  const total = DURATIONS[s.mode];
  patch({
    timeLeft: total,
    totalTime: total,
    endTimestamp: s.running ? Date.now() + total * 1000 : null
  });
  syncTicker();
}

// Mode tabs (D5): switch segment type directly. Resets the segment to
// the target mode's full duration and starts it running (a tab is an
// action; least-surprising). Does NOT touch sessionPomos — only
// naturally-completed/skipped work segments count.
export function setMode(mode) {
  if (!DURATIONS[mode]) return;
  const s = timerStore.get();
  if (s.mode === 'idle' || s.mode === 'select') return;
  if (s.mode === mode) return;
  startSegment(mode);
}

// Session teardown → idle. Clears persistence.
export function exitSession() {
  const s = timerStore.get();
  patch({ ...IDLE_STATE, pomosCompleted: s.pomosCompleted });
  syncTicker();
}

// ─── completion feedback (D8) ────────────────────────────────────────

let audioCtx = null;

function feedback() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  } catch { /* unsupported — silent */ }
  try {
    if (typeof window === 'undefined') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    // Lazily create on first use. iOS requires a user gesture to have
    // occurred; segment completions always follow at least the launch
    // tap, and a suspended context resume() is attempted best-effort.
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const beep = (freq, at, dur) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + dur);
    };
    const t = audioCtx.currentTime;
    beep(880, t, 0.09);
    beep(1318.5, t + 0.1, 0.09);
  } catch { /* audio unavailable — silent */ }
}

// ─── hydration (module load) ─────────────────────────────────────────

function hydrate() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch { /* corrupted/unavailable — fresh start */ }
  if (!saved || saved.mode === 'idle') return;

  // Shape sanity (Codex P4): valid JSON with an invalid shape must not
  // hydrate into a broken session. Unknown mode or non-finite numbers
  // → discard.
  const validModes = ['select', 'work', 'break', 'long-break'];
  if (!validModes.includes(saved.mode)) return;
  for (const k of ['timeLeft', 'totalTime', 'sessionPomos', 'plannedPomos', 'pomosCompleted']) {
    if (saved[k] != null && !Number.isFinite(saved[k])) return;
  }

  // A 'select' session is an unstarted picker — not worth restoring
  // across reloads (focusStore is memory-only, so it would linger
  // invisibly in storage; relaunching from Board is one tap and goes
  // through launch() anyway — Codex P3).
  if (saved.mode === 'select') {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    return;
  }

  // Restore paused segments verbatim.
  if (!saved.running || !saved.endTimestamp) {
    timerStore.set({ ...IDLE_STATE, ...saved, running: false, endTimestamp: null });
    persist();
    return;
  }

  // Running segment: catch up elapsed-while-away time silently.
  timerStore.set({ ...IDLE_STATE, ...saved });
  catchUpExpiredSegments({ silent: true });
  syncTicker();
}

hydrate();

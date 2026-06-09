// Focus surface — Phase 6 rebuild (replaces the 5a stub). Layout per
// DESIGN.md §Focus.jsx + mockups 06-09: back link, task text, project
// line, mode tabs, Ring, controls, session dots. Plus the Phase-6
// 'select' state: the at-launch pomodoro picker (mockup 24 glyph
// semantics relocated from Phase 5b — single tap on glyph N starts
// the session with N planned pomos, spec D4).
//
// Overlay mounting unchanged from 5a-10 (position:fixed pattern,
// Focus.css). focusStore still drives App.jsx's render switch (D10);
// timerStore drives everything inside.
//
// Back-button semantics (D6): leaving Focus does NOT stop a running
// session — clear() only unmounts the view; TopBar keeps showing the
// POMO status. Exception: backing out of the 'select' picker cancels
// the not-yet-started session (exitSession) so no stale select state
// lingers in persistence.
//
// Session end: when REBOOT completes, timer lands in 'idle'; the
// effect below clears focusStore so the app returns to Board. Kept in
// the view (not timer.js) to avoid a timer→focus store dependency.

import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { focusStore, clear } from '../../state/focus.js';
import {
  timerStore,
  startWork,
  pause,
  resume,
  skip,
  reset,
  setMode,
  exitSession
} from '../../state/timer.js';
import { Ring } from './Ring.jsx';
import './Focus.css';

const MODE_CLASS = {
  select: 'mode-select',
  work: 'mode-work',
  break: 'mode-break',
  'long-break': 'mode-reboot'
};

function PomoPicker() {
  // Mockup 24 glyph semantics: tap N commits N. Single tap starts the
  // session (minimal-tap, D4).
  return (
    <div class="pomo-picker" data-testid="pomo-picker">
      <div class="pomo-picker-label">// HOW MANY POMOS?</div>
      <div class="pomo-picker-row">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            class="pomo-glyph-btn"
            onClick={() => startWork(n)}
            data-testid={`pomo-pick-${n}`}
            aria-label={`Start ${n} pomodoro session`}
          >
            <span class="pomo-glyph-count">{n}</span>
            <span class="pomo-glyph-dots">
              {Array.from({ length: n }, (_, i) => (
                <span key={i} class="pomo-mini-dot" />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div class="pomo-picker-sub">1 = QUICK · 2 = 50 MIN · 3 = 75 MIN · 4 = MAX</div>
    </div>
  );
}

export function Focus() {
  const { activeTaskText } = useStore(focusStore);
  const t = useStore(timerStore);

  // Session completed (reboot finished → idle) while Focus is mounted:
  // return to Board.
  useEffect(() => {
    if (t.mode === 'idle' && focusStore.get().activeTaskId) {
      clear();
    }
  }, [t.mode]);

  const inSession = t.mode === 'work' || t.mode === 'break' || t.mode === 'long-break';
  const modeClass = MODE_CLASS[t.mode] || 'mode-select';

  // Task/project lines per mockups: work shows the task; break shows
  // step-away copy; reboot shows reboot copy + CYCLE COMPLETE.
  let taskLine = t.currentTask?.text || activeTaskText || '';
  let projLine = t.currentTask?.project_name || '';
  if (t.mode === 'break') {
    taskLine = 'Step away. Water. Window.';
    projLine = `${projLine || 'SESSION'} · BREAK`;
  } else if (t.mode === 'long-break') {
    taskLine = 'Reboot. Walk. Eat. Return.';
    projLine = 'CYCLE COMPLETE';
  }

  function onBack() {
    if (t.mode === 'select') exitSession(); // cancel unstarted session
    clear();
  }

  // Primary control per mockups 06-09.
  let primaryLabel = 'PAUSE';
  let primaryAction = pause;
  let primaryClass = 'ctrl-btn primary';
  if (t.mode === 'work' && !t.running) {
    primaryLabel = 'RESUME';
    primaryAction = resume;
    primaryClass += ' paused';
  } else if (t.mode === 'break') {
    primaryLabel = 'SKIP';
    primaryAction = skip;
    primaryClass += ' break';
  } else if (t.mode === 'long-break') {
    primaryLabel = 'SKIP';
    primaryAction = skip;
    primaryClass += ' reboot';
  }

  // Dots reflect ACTUAL completed work segments (Codex P4: the manual
  // REBOOT tab must not imply cycle completion). The natural reboot —
  // sessionPomos === plannedPomos — still shows all filled, matching
  // mockup 09.
  const dots = Array.from({ length: t.plannedPomos || 0 }, (_, i) => ({
    filled: i < t.sessionPomos,
    reboot: t.mode === 'long-break'
  }));

  return (
    <main
      class={`focus surface-enter ${modeClass}`}
      data-testid="focus-root"
      data-mode={t.mode}
    >
      <button
        type="button"
        class="focus-back"
        onClick={onBack}
        data-testid="focus-back"
      >
        ← BOARD
      </button>

      <div class="focus-task-line" data-testid="focus-task-line">{taskLine}</div>
      <div class="focus-proj-line" data-testid="focus-proj-line">
        {(t.mode === 'work' || t.mode === 'select') && (
          <span class="focus-proj-dot">● </span>
        )}
        {(projLine || '').toUpperCase()}
      </div>

      {t.mode === 'select' && <PomoPicker />}

      {inSession && (
        <>
          <div class="mode-tabs" data-testid="focus-mode-tabs">
            <button
              type="button"
              class={`mode-tab${t.mode === 'work' ? ' active focus-mode' : ''}`}
              onClick={() => setMode('work')}
              data-testid="mode-tab-focus"
            >FOCUS</button>
            <button
              type="button"
              class={`mode-tab${t.mode === 'break' ? ' active break-mode' : ''}`}
              onClick={() => setMode('break')}
              data-testid="mode-tab-break"
            >BREAK</button>
            <button
              type="button"
              class={`mode-tab${t.mode === 'long-break' ? ' active reboot-mode' : ''}`}
              onClick={() => setMode('long-break')}
              data-testid="mode-tab-reboot"
            >REBOOT</button>
          </div>

          <Ring
            mode={t.mode}
            timeLeft={t.timeLeft}
            totalTime={t.totalTime}
            running={t.running}
          />

          <div class="focus-controls">
            <button
              type="button"
              class="ctrl-btn"
              onClick={() => reset()}
              aria-label="Restart segment"
              data-testid="focus-reset"
            >↻</button>
            <button
              type="button"
              class={primaryClass}
              onClick={() => primaryAction()}
              data-testid="focus-primary"
            >{primaryLabel}</button>
            <button
              type="button"
              class="ctrl-btn"
              onClick={() => skip()}
              aria-label="Skip to next segment"
              data-testid="focus-skip"
            >⏭</button>
          </div>

          <div class="session-dots" data-testid="session-dots">
            {dots.map((d, i) => (
              <span
                key={i}
                class={`session-dot${d.filled ? ' filled' : ''}${d.reboot ? ' reboot' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

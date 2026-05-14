import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { TopBar } from './components/TopBar/TopBar.jsx';
import { Board } from './components/Board/Board.jsx';
import { Focus } from './components/Focus/Focus.jsx';
import { Muse } from './components/Muse/Muse.jsx';
import { Onboard } from './components/Onboard/Onboard.jsx';
import { boardStore, fetchBoard } from './state/board.js';
import { onboardStore, openOnboard, closeOnboard } from './state/onboard.js';
import { focusStore } from './state/focus.js';

// Auto-open onboarding when the board finishes loading and registry
// shows zero active projects. There is no manual launcher from Board —
// post-onboarding new-project entry routes through Muse (Board.jsx:67-72
// wires + NEW PROJECT to museOpen with the right prefill, per mockup
// 02-board-empty.html). The only paths into Onboard are this hook (empty
// registry) and ?force-onboard=1 (dev/test override, see effect below).
function useAutoOnboard() {
  const { summary, loading, error, lastFetchAt } = useStore(boardStore);
  const { isActive, step } = useStore(onboardStore);
  const triggered = useRef(false);

  // Trigger once per session on first successful fetch that returns an
  // empty registry. Don't re-open after the user exits — respect their
  // explicit dismissal.
  useEffect(() => {
    if (triggered.current) return;
    if (loading || error || !lastFetchAt) return;
    if (isActive) return;
    if (summary.length === 0) {
      triggered.current = true;
      openOnboard();
    }
  }, [summary.length, loading, error, lastFetchAt, isActive]);

  // Clean up after a successful commit: refresh the board and dismiss
  // the onboarding layer. Runs when step flips to 'done'.
  useEffect(() => {
    if (step === 'done') {
      fetchBoard();
      closeOnboard(true);
    }
  }, [step]);
}

export function App() {
  const { isActive } = useStore(onboardStore);
  const { activeTaskId } = useStore(focusStore);
  useAutoOnboard();

  // Dev-only override: `?force-onboard=1` opens onboarding regardless of
  // registry state. Lets phase-4 phone testing exercise the full flow on an
  // account with existing projects without wiping the live vault. Remove
  // after Phase 4 merges and dedicated empty-vault testing is feasible.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('force-onboard') === '1' && !onboardStore.get().isActive) {
        openOnboard();
      }
    } catch (_e) { /* URL parse failures are harmless */ }
  }, []);

  return (
    <>
      <div class="bg-gradient" />
      <div class="grid-overlay" />
      {!isActive && <TopBar />}
      {!isActive && (activeTaskId ? <Focus /> : <Board />)}
      {!isActive && <Muse />}
      <Onboard />
    </>
  );
}

import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { TopBar } from './components/TopBar/TopBar.jsx';
import { Board } from './components/Board/Board.jsx';
import { Muse } from './components/Muse/Muse.jsx';
import { Onboard } from './components/Onboard/Onboard.jsx';
import { boardStore, fetchBoard } from './state/board.js';
import { onboardStore, openOnboard, closeOnboard } from './state/onboard.js';

// Auto-open onboarding when the board finishes loading and registry
// shows zero active projects. Manual entry from Board's "+ NEW PROJECT"
// button (and the empty state CTA) is wired in Board.jsx via openOnboard.
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
  useAutoOnboard();

  return (
    <>
      <div class="bg-gradient" />
      <div class="grid-overlay" />
      {!isActive && <TopBar />}
      {!isActive && <Board />}
      {!isActive && <Muse />}
      <Onboard />
    </>
  );
}

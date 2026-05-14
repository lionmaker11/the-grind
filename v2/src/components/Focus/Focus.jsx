import { useStore } from '@nanostores/preact';
import { focusStore, clear } from '../../state/focus.js';
import './Focus.css';

export function Focus() {
  const { activeTaskText } = useStore(focusStore);

  return (
    <main class="focus" data-testid="focus-root">
      <button
        type="button"
        class="focus-back"
        onClick={() => clear()}
        data-testid="focus-back"
      >
        ← BOARD
      </button>

      <div class="focus-stub-content">
        <div class="focus-task-text">{activeTaskText}</div>
        <div class="focus-stub-note">
          // FOCUS SURFACE — PHASE 6
        </div>
      </div>
    </main>
  );
}

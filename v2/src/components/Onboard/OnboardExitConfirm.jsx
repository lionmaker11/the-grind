// Confirmation modal for mid-flow exits. Shown when the close button
// is tapped from any interactive step (not intro / done). Dismisses
// either back into the current step (cancel) or clears the flow
// (confirm).

import { confirmExit, cancelExit } from '../../state/onboard.js';
import './OnboardExitConfirm.css';

export function OnboardExitConfirm() {
  return (
    <div class="oec-backdrop" role="dialog" aria-modal="true" aria-label="Exit onboarding confirmation">
      <div class="oec-box">
        <div class="oec-body">Bail out? You&apos;ll lose what you said.</div>
        <div class="oec-actions">
          <button
            type="button"
            class="oec-btn oec-btn--danger"
            onClick={confirmExit}
            data-testid="onboard-exit-confirm"
          >
            BAIL
          </button>
          <button
            type="button"
            class="oec-btn"
            onClick={cancelExit}
            data-testid="onboard-exit-cancel"
          >
            KEEP GOING
          </button>
        </div>
      </div>
    </div>
  );
}

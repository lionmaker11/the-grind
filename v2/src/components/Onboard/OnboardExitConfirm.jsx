// Confirmation modal for mid-flow exits. Shown when the close button
// is tapped from any interactive step (not intro / done). Dismisses
// either back into the current step (cancel) or clears the flow
// (confirm).

import { confirmExit, cancelExit } from '../../state/onboard.js';
import './OnboardExitConfirm.css';

export function OnboardExitConfirm() {
  return (
    <div class="oec-backdrop" role="dialog" aria-modal="true" aria-labelledby="oec-title">
      <div class="oec-box">
        <div id="oec-title" class="oec-title">// EXIT ONBOARDING?</div>
        <div class="oec-body">Your answers will be lost.</div>
        <div class="oec-actions">
          <button
            type="button"
            class="oec-btn"
            onClick={cancelExit}
            data-testid="onboard-exit-cancel"
          >
            CANCEL
          </button>
          <button
            type="button"
            class="oec-btn oec-btn--danger"
            onClick={confirmExit}
            data-testid="onboard-exit-confirm"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

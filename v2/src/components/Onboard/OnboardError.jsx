// Error surface. Rendered when onboardStore.step === 'error'. The error
// object carries the origin step + a user-readable message + whether
// retry is offered. Retry routes to ERROR_RECOVERY_STEP (clearError);
// restart resets the flow to intro.

import { useStore } from '@nanostores/preact';
import { onboardStore, clearError, recoverToIntro } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import './OnboardError.css';

export function OnboardError() {
  const { step, error } = useStore(onboardStore);
  const message = error?.message || 'Something went wrong.';
  const recoverable = error?.recoverable !== false;

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo">
        <div class="oe-box" role="alert">
          <div class="oe-title">// ERROR</div>
          <div class="oe-message">{message}</div>
          <div class="oe-actions">
            {recoverable && (
              <button
                type="button"
                class="oe-btn oe-btn--primary"
                onClick={clearError}
                data-testid="onboard-error-retry"
              >
                RETRY
              </button>
            )}
            <button
              type="button"
              class="oe-btn"
              onClick={recoverToIntro}
              data-testid="onboard-error-restart"
            >
              START FRESH
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

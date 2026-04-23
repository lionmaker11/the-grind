// Error surface. Rendered when onboardStore.step === 'error'. The error
// object carries the origin step + a user-readable message + whether
// retry is offered. Retry routes per ERROR_RECOVERY_STEP in the state
// store (capture-record → capture-ask, clarify-record → clarify-ask,
// parsing → review, committing → review) via clearError; restart
// resets to intro via recoverToIntro.

import { useStore } from '@nanostores/preact';
import { onboardStore, clearError, recoverToIntro } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import './OnboardError.css';

export function OnboardError() {
  const { step, error, commitProgress } = useStore(onboardStore);
  const message = error?.message || 'Something went wrong.';
  const recoverable = error?.recoverable !== false;
  const failed = commitProgress?.failed || [];

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
          {failed.length > 0 && (
            <div class="or-placeholder-failures" data-testid="onboard-error-failures">
              <div>// FAILURES ({failed.length})</div>
              {failed.map((f, i) => (
                <div key={i} class="or-placeholder-failure-line">
                  [{f.kind}] {f.project || f.name || ''} {f.text ? `"${f.text}"` : ''} — {f.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

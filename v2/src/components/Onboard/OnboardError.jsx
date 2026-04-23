// Error surface. Rendered when onboardStore.step === 'error'. Copy + button
// label + recovery action are picked from a per-variant resolver, keyed on
// error.variant (set at every setError dispatch site — see state/onboard.js
// ERROR_VARIANTS). Spec: vault/build/phase4-flow-redesign.md § Copy manifest
// (OnboardError rows) and § Failure-mode handling.
//
// Single button per variant. The user's escape hatch is the standard ×
// exit affordance rendered by Onboard.jsx — no START FRESH duplicate here.

import { useStore } from '@nanostores/preact';
import { onboardStore, clearError, recoverToIntro } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import './OnboardError.css';

function resolveVariant(error) {
  const variant = error?.variant;

  if (variant === 'transcription') {
    return {
      message: "Didn't catch that. Try again?",
      buttonLabel: 'TRY AGAIN',
      onAction: clearError,
      testid: 'onboard-error-transcription'
    };
  }

  if (variant === 'empty-extraction') {
    return {
      message: "Couldn't pull anything out of that. Want to take another pass?",
      buttonLabel: 'TAKE ANOTHER PASS',
      onAction: recoverToIntro,
      testid: 'onboard-error-empty-extraction'
    };
  }

  if (variant === 'partial-commit') {
    const n = typeof error?.failedCount === 'number' ? error.failedCount : 0;
    const message = n === 1
      ? "1 didn't save. Retry just this?"
      : `${n} didn't save. Retry just those?`;
    return {
      message,
      buttonLabel: 'RETRY ▶',
      onAction: clearError,
      testid: 'onboard-error-partial-commit'
    };
  }

  // 'generic' or unknown — fall back to error.message with a final default.
  return {
    message: error?.message || 'Something went wrong.',
    buttonLabel: 'TRY AGAIN',
    onAction: clearError,
    testid: 'onboard-error-generic'
  };
}

export function OnboardError() {
  const { step, error } = useStore(onboardStore);
  const { message, buttonLabel, onAction, testid } = resolveVariant(error);

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo">
        <div class="oe-box" role="alert">
          <div class="oe-title">// ERROR</div>
          <div class="oe-message">{message}</div>
          <div class="oe-actions">
            <button
              type="button"
              class="oe-btn oe-btn--primary"
              onClick={onAction}
              data-testid={testid}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

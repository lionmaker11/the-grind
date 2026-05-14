import { useStore } from '@nanostores/preact';
import { onboardStore, closeOnboard } from '../../state/onboard.js';
import { OnboardIntro } from './OnboardIntro.jsx';
import { OnboardAsk } from './OnboardAsk.jsx';
import { OnboardRecord } from './OnboardRecord.jsx';
import { OnboardClarify } from './OnboardClarify.jsx';
import { OnboardParsing } from './OnboardParsing.jsx';
import { OnboardReview } from './OnboardReview.jsx';
import { OnboardError } from './OnboardError.jsx';
import { OnboardExitConfirm } from './OnboardExitConfirm.jsx';
import './Onboard.css';

// Full-screen takeover. Mounted once at app root when onboardStore.isActive.
// Branches on step. Intro is centered; every other step uses the standard
// onboard layout (muse head + conversation + footer/mic). 9-state machine
// per phase4-redesign-spec.md.

export function Onboard() {
  const state = useStore(onboardStore);
  if (!state.isActive) return null;

  const { step, exitConfirmOpen } = state;

  let body;
  if (step === 'intro') {
    body = <OnboardIntro />;
  } else if (step === 'capture-ask') {
    body = <OnboardAsk />;
  } else if (step === 'capture-record' || step === 'clarify-record') {
    // OnboardRecord handles both capture and clarify recording phases.
    // It reads the current step from the store to pick finalizeCapture
    // vs finalizeClarify and to decide whether to render the compressed
    // capture preview above the live transcript.
    body = <OnboardRecord />;
  } else if (step === 'clarify-ask') {
    body = <OnboardClarify />;
  } else if (step === 'parsing') {
    body = <OnboardParsing />;
  } else if (step === 'review' || step === 'committing') {
    body = <OnboardReview />;
  } else if (step === 'error') {
    body = <OnboardError />;
  } else if (step === 'done') {
    body = null;
  }

  const showClose = step !== 'intro' && step !== 'review' && step !== 'committing' && step !== 'done';

  return (
    <div class="onboard-root" data-testid="onboard-root" data-step={step}>
      {body}
      {showClose && (
        <button
          type="button"
          class="onboard-close"
          aria-label="Exit onboarding"
          onClick={() => closeOnboard()}
          data-testid="onboard-close"
        >
          ×
        </button>
      )}
      {exitConfirmOpen && <OnboardExitConfirm />}
    </div>
  );
}

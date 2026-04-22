import { useStore } from '@nanostores/preact';
import { onboardStore, closeOnboard } from '../../state/onboard.js';
import { OnboardIntro } from './OnboardIntro.jsx';
import { OnboardAsk } from './OnboardAsk.jsx';
import { OnboardRecord } from './OnboardRecord.jsx';
import { OnboardParsing } from './OnboardParsing.jsx';
import { OnboardReview } from './OnboardReview.jsx';
import { OnboardError } from './OnboardError.jsx';
import { OnboardExitConfirm } from './OnboardExitConfirm.jsx';
import './Onboard.css';

// Full-screen takeover. Mounted once at app root when onboardStore.isActive.
// Branches on step. Intro is centered; every other step uses the standard
// onboard layout (muse head + conversation + footer/mic).

export function Onboard() {
  const state = useStore(onboardStore);
  if (!state.isActive) return null;

  const { step, exitConfirmOpen } = state;

  let body;
  if (step === 'intro') {
    body = <OnboardIntro />;
  } else if (step === 'q1-ask' || step === 'q2-ask' || step === 'q3-ask') {
    body = <OnboardAsk />;
  } else if (step === 'q1-record' || step === 'q2-record' || step === 'q3-record') {
    body = <OnboardRecord />;
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

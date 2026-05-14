// Clarify-ask screen — Opus has returned a targeted follow-up question
// (extracted.clarificationNeeded.question) after seeing the capture pass.
// User can either tap the mic to record a short answer (→ clarify-record)
// or tap SKIP to accept the first-pass extraction as-is (→ review).
//
// Mockup reference: 38-onboard-clarify-ask.html. Distinct from OnboardAsk
// in four ways: compressed-capture preview above the question, dynamic
// (LLM-generated) question text, SKIP affordance, small mic + short-
// answer hint copy. Coexists with the standard × close button (top-right,
// rendered by Onboard.jsx).

import { useStore } from '@nanostores/preact';
import { onboardStore, startRecording, skipClarify } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';

const MIC_HINT = 'Short answer. Or tap skip.';
// Fallback if we landed in clarify-ask without a question payload — shouldn't
// happen (receiveExtraction only routes here when clarificationNeeded is set)
// but defends against upstream regressions.
const FALLBACK_QUESTION = 'Anything else I should know?';

export function OnboardClarify() {
  const { step, capture, extracted } = useStore(onboardStore);
  const question = extracted?.clarificationNeeded?.question || FALLBACK_QUESTION;

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo" data-testid="onboard-convo">
        {capture && (
          <div class="capture-compressed" data-testid="capture-compressed">
            <span class="tag">// YOU · CAPTURE</span>
            {capture}
          </div>
        )}
        <OnboardMessage role="muse" text={question} />
      </div>
      <button
        type="button"
        class="skip-btn"
        onClick={skipClarify}
        data-testid="onboard-skip-clarify"
      >
        SKIP — I'LL FIX IN REVIEW
      </button>
      <div class="big-mic-wrap">
        <button
          type="button"
          class="big-mic armed small"
          aria-label="Start recording clarification"
          onClick={startRecording}
          data-testid="onboard-mic-armed"
        >
          ●
        </button>
        <div class="mic-hint">{MIC_HINT}</div>
      </div>
    </>
  );
}

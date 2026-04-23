// Capture-ask screen — Muse poses the single capture question and waits
// for the mic tap. No conversation history (capture is one pass); the
// mockup's subtext ("// Work, personal, health, anything.") sits below
// the question. Tap the armed mic to transition to capture-record.
//
// Clarify-ask is a different component (OnboardClarify) — distinct UI
// (compressed capture preview, skip button, dynamic LLM question).

import { useStore } from '@nanostores/preact';
import { onboardStore, startRecording } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';

const CAPTURE_QUESTION = "Walk me through what's active. Every project, what's happening.";
const CAPTURE_SUBTEXT = '// Work, personal, health, anything.';
const MIC_HINT = 'Tap to start. Take your time — 1 to 3 minutes is normal.';

export function OnboardAsk() {
  const { step } = useStore(onboardStore);

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo" data-testid="onboard-convo">
        <OnboardMessage role="muse" text={CAPTURE_QUESTION} />
        <div class="capture-subtext">{CAPTURE_SUBTEXT}</div>
      </div>
      <div class="big-mic-wrap">
        <button
          type="button"
          class="big-mic armed"
          aria-label="Start recording"
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

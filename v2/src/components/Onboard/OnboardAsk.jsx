// "Asking" screen — Muse has posed the current question and is awaiting
// the mic tap. Conversation history (prior Q/A pairs) scrolls above.
// Tap the armed mic to transition to the corresponding record step.

import { useStore } from '@nanostores/preact';
import { onboardStore, startRecording } from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';

const QUESTIONS = {
  1: 'What projects are you running right now?',
  2: "What's on fire? Anything overdue or due this week.",
  3: 'Close one thing this week. What is it?'
};

export function OnboardAsk() {
  const { step, currentQuestion, answers } = useStore(onboardStore);
  const qNum = currentQuestion || parseInt(step.charAt(1), 10) || 1;

  const history = [];
  for (let i = 1; i < qNum; i++) {
    history.push({ role: 'muse', text: QUESTIONS[i] });
    const ans = answers[`q${i}`];
    if (ans) history.push({ role: 'user', text: ans });
  }

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo" data-testid="onboard-convo">
        {history.map((m, i) => (
          <OnboardMessage key={`h-${i}`} role={m.role} text={m.text} variant={m.role === 'user' ? 'finalized' : undefined} />
        ))}
        <OnboardMessage role="muse" text={QUESTIONS[qNum]} />
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
        <div class="mic-hint">Tap to record — tap again when done</div>
      </div>
    </>
  );
}

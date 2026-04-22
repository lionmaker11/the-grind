// Muse-header strip at the top of every onboarding screen (except intro).
// Derives its status label from the current step + flags — no numerator.

import './OnboardFooter.css';

function deriveLabel(step, isRecording, isTranscribing) {
  if (step === 'q1-ask' || step === 'q2-ask' || step === 'q3-ask') {
    const n = step.charAt(1);
    return `Q${n} · MIC ARMED`;
  }
  if (step === 'q1-record' || step === 'q2-record' || step === 'q3-record') {
    const n = step.charAt(1);
    if (isTranscribing) return `Q${n} · TRANSCRIBING`;
    if (isRecording) return `Q${n} · RECORDING`;
    return `Q${n} · READY`;
  }
  if (step === 'parsing') return 'PARSING';
  if (step === 'review') return 'REVIEW';
  if (step === 'committing') return 'LOCKING IN';
  if (step === 'error') return 'ERROR';
  return 'ONBOARDING';
}

export function OnboardFooter({ step, isRecording = false, isTranscribing = false }) {
  const label = deriveLabel(step, isRecording, isTranscribing);
  return (
    <div class="onboard-musehead">
      <span class="muse-dot" aria-hidden="true" />
      <div class="muse-avatar" aria-hidden="true">M</div>
      <div class="muse-title-col">
        <span class="muse-title">MUSE</span>
        <span class="of-status" data-testid="onboard-status">// {label}</span>
      </div>
    </div>
  );
}

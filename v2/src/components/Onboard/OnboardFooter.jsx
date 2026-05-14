// Muse-header strip at the top of every onboarding screen (except intro).
// Derives its status label from the current step + flags. Labels mirror
// the mockup copy (36/37/38/39/40) so status strings stay consistent
// between design reference and running app.

import './OnboardFooter.css';

function deriveLabel(step, isRecording, isTranscribing) {
  if (step === 'capture-ask') {
    return 'CAPTURE · MIC ARMED';
  }
  if (step === 'capture-record') {
    if (isTranscribing) return 'CAPTURE · TRANSCRIBING';
    if (isRecording) return 'CAPTURE · RECORDING';
    return 'CAPTURE · READY';
  }
  if (step === 'clarify-ask') {
    return 'CLARIFY · MIC ARMED';
  }
  if (step === 'clarify-record') {
    if (isTranscribing) return 'CLARIFY · TRANSCRIBING';
    if (isRecording) return 'CLARIFY · RECORDING';
    return 'CLARIFY · READY';
  }
  if (step === 'parsing') return 'PARSING';
  if (step === 'review') return 'REVIEW';
  if (step === 'committing') return 'LOCKING IN';
  if (step === 'done') return 'DONE';
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

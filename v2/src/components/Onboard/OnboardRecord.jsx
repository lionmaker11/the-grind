// Recording screen. On mount, fires up the MediaRecorder via voice.js.
// User taps the pulsing mic to stop → postTranscribe → finalizeTranscript
// → auto-advance to next question or to parsing.
//
// This is the only Onboard component that imports voice.js or
// postTranscribe — other screens stay pure.

import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  onboardStore,
  stopRecording,
  finalizeTranscript,
  setError
} from '../../state/onboard.js';
import { startRecording } from '../../lib/voice.js';
import { postTranscribe } from '../../lib/api.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';

const QUESTIONS = {
  1: 'What projects are you running right now?',
  2: "What's on fire? Anything overdue or due this week.",
  3: 'Close one thing this week. What is it?'
};

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function OnboardRecord() {
  const { step, currentQuestion, answers, isRecording, isTranscribing } = useStore(onboardStore);
  const qNum = currentQuestion || parseInt(step.charAt(1), 10) || 1;

  const handleRef = useRef(null);
  const startedAtRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);

  // Kick off the MediaRecorder once on mount. If it fails (mic denied,
  // unsupported browser), surface an error and let the user retry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const handle = await startRecording();
        if (cancelled) {
          try { handle.cancel(); } catch (_e) { /* already stopped */ }
          return;
        }
        handleRef.current = handle;
        startedAtRef.current = Date.now();
      } catch (err) {
        if (cancelled) return;
        setError(`q${qNum}-record`, err?.message || 'microphone unavailable', true);
      }
    })();
    return () => {
      cancelled = true;
      if (handleRef.current) {
        try { handleRef.current.cancel(); } catch (_e) { /* already stopped */ }
        handleRef.current = null;
      }
    };
  }, []);

  // Tick the on-screen timer once per second while recording.
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  async function handleStop() {
    if (stopping || !handleRef.current) return;
    setStopping(true);
    const handle = handleRef.current;
    handleRef.current = null;
    stopRecording();
    try {
      const blob = await handle.stop();
      const text = await postTranscribe(blob);
      finalizeTranscript(text || '');
    } catch (err) {
      setError(`q${qNum}-record`, err?.message || 'transcription failed', true);
    } finally {
      setStopping(false);
    }
  }

  // Build history (prior Q/A pairs + current Q) so the conversation
  // stream matches OnboardAsk.
  const history = [];
  for (let i = 1; i < qNum; i++) {
    history.push({ role: 'muse', text: QUESTIONS[i] });
    const ans = answers[`q${i}`];
    if (ans) history.push({ role: 'user', text: ans });
  }

  const transcriptLabel = isTranscribing
    ? 'TRANSCRIBING…'
    : 'LISTENING…';

  return (
    <>
      <OnboardFooter step={step} isRecording={isRecording} isTranscribing={isTranscribing} />
      <div class="onboard-convo" data-testid="onboard-convo">
        {history.map((m, i) => (
          <OnboardMessage key={`h-${i}`} role={m.role} text={m.text} variant={m.role === 'user' ? 'finalized' : undefined} />
        ))}
        <OnboardMessage role="muse" text={QUESTIONS[qNum]} />
        <OnboardMessage role="user" variant="dashed" text={transcriptLabel} showCaret />
      </div>
      <div class="big-mic-wrap">
        <button
          type="button"
          class={`big-mic ${isRecording ? 'recording' : 'disabled'}`}
          aria-label="Stop recording"
          onClick={handleStop}
          disabled={!isRecording || stopping}
          data-testid="onboard-mic-recording"
        >
          ●
        </button>
        <div class="mic-timer" data-testid="onboard-timer">
          {formatTimer(elapsed)} {isRecording ? 'LISTENING...' : isTranscribing ? 'TRANSCRIBING...' : 'READY'}
        </div>
      </div>
    </>
  );
}

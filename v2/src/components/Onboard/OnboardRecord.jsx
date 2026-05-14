// Recording screen — drives MediaRecorder via voice.js, dispatches back
// to the store on stop. Handles BOTH capture-record and clarify-record:
// three step-aware decisions only (finalize target, question bubble,
// compressed-capture preview). All mic machinery is shared.
//
// This is the only Onboard component that imports voice.js or
// postTranscribe — other screens stay pure.

import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  onboardStore,
  stopRecording,
  finalizeCapture,
  finalizeClarify,
  setError
} from '../../state/onboard.js';
import { startRecording } from '../../lib/voice.js';
import { postTranscribe } from '../../lib/api.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';

const CAPTURE_QUESTION = "Walk me through what's active. Every project, what's happening.";

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function OnboardRecord() {
  const { step, capture, extracted, isRecording, isTranscribing } = useStore(onboardStore);
  const isClarify = step === 'clarify-record';

  const handleRef = useRef(null);
  const startedAtRef = useRef(null);
  // Guards post-stop dispatch: if the user exits (× → confirmExit) while
  // transcription is in-flight, postTranscribe resolves against a store
  // that's been reset. Check this after each await in handleStop so we
  // don't fire finalizeCapture / finalizeClarify / setError into an
  // unmounted context.
  const unmountedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);

  // Kick off the MediaRecorder once on mount. If it fails (mic denied,
  // unsupported browser), surface an error and let the user retry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Mark the start BEFORE awaiting the recorder so the on-screen
        // timer reflects user perception ("I tapped the mic, time starts")
        // rather than the getUserMedia resolve moment.
        startedAtRef.current = Date.now();
        const handle = await startRecording();
        if (cancelled) {
          try { handle.cancel(); } catch (_e) { /* already stopped */ }
          return;
        }
        handleRef.current = handle;
      } catch (err) {
        if (cancelled) return;
        setError(step, err?.message || 'microphone unavailable', 'transcription', true);
      }
    })();
    return () => {
      cancelled = true;
      unmountedRef.current = true;
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
      if (unmountedRef.current) return;
      const text = await postTranscribe(blob);
      if (unmountedRef.current) return;
      if (isClarify) {
        finalizeClarify(text || '');
      } else {
        finalizeCapture(text || '');
      }
    } catch (err) {
      if (unmountedRef.current) return;
      setError(step, err?.message || 'transcription failed', 'transcription', true);
    } finally {
      setStopping(false);
    }
  }

  const questionText = isClarify
    ? (extracted?.clarificationNeeded?.question || '')
    : CAPTURE_QUESTION;

  const transcriptLabel = isTranscribing ? 'TRANSCRIBING…' : 'LISTENING…';

  return (
    <>
      <OnboardFooter step={step} isRecording={isRecording} isTranscribing={isTranscribing} />
      <div class="onboard-convo" data-testid="onboard-convo">
        {isClarify && capture && (
          <div class="capture-compressed" data-testid="capture-compressed">
            <span class="tag">// YOU · CAPTURE</span>
            {capture}
          </div>
        )}
        <OnboardMessage role="muse" text={questionText} />
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

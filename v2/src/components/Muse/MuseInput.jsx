import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { museStore, recordStart, recordStop, send } from '../../state/muse.js';
import './MuseInput.css';

// 800ms is the auto-send delay after transcription completes — see
// DESIGN.md §5 MuseInput. If the user edits during the window, the
// countdown cancels. If the user hasn't touched it, we auto-send.
const AUTO_SEND_MS = 800;

export function MuseInput() {
  const {
    isOpen,
    isRecording,
    isTranscribing,
    isSending,
    isOnline,
    voiceText,
    prefill
  } = useStore(museStore);

  const [text, setText] = useState('');
  const autoSendTimer = useRef(null);
  const userEditedRef = useRef(false);
  const inputRef = useRef(null);

  // Prefill when sheet opens with { prefill: 'new project: ' }
  useEffect(() => {
    if (!isOpen) return;
    if (prefill && !text) {
      setText(prefill);
      userEditedRef.current = true;
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          try { inputRef.current.setSelectionRange(len, len); } catch (_e) { /* older inputs throw on setSelectionRange */ }
        }
      });
    }
  }, [isOpen, prefill]);

  // Voice transcript arrives -> populate input + start 800ms auto-send
  useEffect(() => {
    if (!voiceText) return;
    setText(voiceText);
    userEditedRef.current = false;
    clearTimeout(autoSendTimer.current);
    autoSendTimer.current = setTimeout(() => {
      if (userEditedRef.current) return;
      const current = museStore.get().voiceText;
      if (current) {
        setText('');
        send(current);
      }
    }, AUTO_SEND_MS);
    return () => clearTimeout(autoSendTimer.current);
  }, [voiceText]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setText('');
      userEditedRef.current = false;
      clearTimeout(autoSendTimer.current);
    }
  }, [isOpen]);

  const inputDisabled = !isOnline || isSending || isTranscribing;
  const sendDisabled = inputDisabled || !text.trim();
  const micDisabled  = !isOnline || isSending || isTranscribing;

  const onInput = (e) => {
    setText(e.currentTarget.value);
    userEditedRef.current = true;
    clearTimeout(autoSendTimer.current);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (sendDisabled) return;
    const payload = text.trim();
    setText('');
    clearTimeout(autoSendTimer.current);
    send(payload);
  };

  const onMic = () => {
    if (micDisabled) return;
    if (isRecording) recordStop();
    else recordStart();
  };

  const micClass =
    'muse-mic'
    + (isRecording ? ' recording' : '')
    + (micDisabled && !isRecording ? ' dimmed' : '');

  const sendClass = 'muse-send' + (sendDisabled ? ' dimmed' : '');

  const placeholder =
    !isOnline          ? 'OFFLINE — INPUT DISABLED' :
    isTranscribing     ? 'TRANSCRIBING...'          :
    isSending          ? 'SENDING...'               :
                         'TYPE OR DICTATE...';

  return (
    <form class="muse-footer" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        class={`muse-input${isRecording ? ' live' : ''}`}
        type="text"
        placeholder={placeholder}
        value={text}
        onInput={onInput}
        disabled={inputDisabled}
        aria-label="Message Muse"
        data-testid="muse-input"
      />
      <button
        type="button"
        class={micClass}
        onClick={onMic}
        disabled={micDisabled}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
        data-testid="muse-mic"
      >
        <span aria-hidden="true">●</span>
      </button>
      <button
        type="submit"
        class={sendClass}
        disabled={sendDisabled}
        aria-label="Send message"
        data-testid="muse-send"
      >
        <span aria-hidden="true">▶</span>
      </button>
    </form>
  );
}

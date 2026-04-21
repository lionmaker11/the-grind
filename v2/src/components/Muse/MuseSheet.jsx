import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { museStore, close } from '../../state/muse.js';
import { MuseMessage } from './MuseMessage.jsx';
import { MuseInput } from './MuseInput.jsx';
import './MuseSheet.css';

// Slide-up sheet. Backdrop + panel. Header shows status line, body scrolls
// messages, footer is the input. Thinking indicator renders inline while
// Muse is transcribing or sending.
export function MuseSheet() {
  const { messages, status, isOnline, isSending, isTranscribing } = useStore(museStore);
  const bodyRef = useRef(null);

  // Auto-scroll to bottom on new message or state change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages.length, isSending, isTranscribing]);

  // Escape closes sheet
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const statusText =
    !isOnline               ? '// OFFLINE'       :
    status === 'listening'  ? '// LISTENING'     :
    status === 'transcribing' ? '// TRANSCRIBING' :
    status === 'thinking'   ? '// THINKING'      :
    status === 'error'      ? '// ERROR'         :
                              '// ONLINE';

  const statusClass =
    'muse-status'
    + (status === 'listening'            ? ' listening' : '')
    + ((!isOnline || status === 'error') ? ' offline'   : '');

  const showGreeting = messages.length === 0 && isOnline;

  return (
    <>
      <div class="muse-backdrop" onClick={close} aria-hidden="true" />
      <aside class="muse-sheet" role="dialog" aria-modal="true" aria-label="Muse" data-testid="muse-sheet">
        <header class="muse-header">
          <span
            class={`muse-header-dot${status === 'listening' ? ' listening' : ''}`}
            aria-hidden="true"
          />
          <span class="muse-title">MUSE</span>
          <span class={statusClass} data-testid="muse-status">{statusText}</span>
          <button class="muse-close" type="button" aria-label="Close Muse" onClick={close}>
            ×
          </button>
        </header>

        <div class="muse-body" ref={bodyRef}>
          {showGreeting && (
            <div class="muse-empty-greeting" data-testid="muse-greeting">
              // TAP ● TO SPEAK · OR TYPE BELOW
            </div>
          )}
          {messages.map((m) => (
            <MuseMessage key={m.id} msg={m} />
          ))}
          {(isSending || isTranscribing) && (
            <div class="muse-thinking" aria-live="polite" data-testid="muse-thinking">
              <span class="muse-thinking-dot" />
              <span class="muse-thinking-dot" />
              <span class="muse-thinking-dot" />
            </div>
          )}
        </div>

        <MuseInput />
      </aside>
    </>
  );
}

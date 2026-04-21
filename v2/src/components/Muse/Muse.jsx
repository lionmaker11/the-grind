import { useStore } from '@nanostores/preact';
import { museStore, open } from '../../state/muse.js';
import { MuseSheet } from './MuseSheet.jsx';
import './Muse.css';

// Muse container. Owns the FAB (when closed) and the sheet (when open).
// Mounted once at app root — see app.jsx.
export function Muse() {
  const { isOpen } = useStore(museStore);
  return (
    <>
      {!isOpen && (
        <button
          type="button"
          class="muse-fab muse-fab--btn"
          aria-label="Open Muse"
          onClick={() => open()}
          data-testid="muse-fab"
        >
          <span aria-hidden="true">●</span>
        </button>
      )}
      {isOpen && <MuseSheet />}
    </>
  );
}

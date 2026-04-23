// OrphanPicker — bottom-sheet for assigning a single orphan task to a target.
// Spec: vault/build/phase4-flow-redesign.md § "Review UX architecture" §
// "Orphan picker" + § "Copy manifest" rows for the orphan picker.
//
// Unwired in R5b-4: created and tested standalone via npm run build, but no
// parent renders it yet. OnboardReview will mount this in R5b-5/6 alongside
// the rewritten review surface.
//
// ─── Registry source note ─────────────────────────────────────────────────
// The spec says "Existing vault projects" come from "the same registry source
// used by extraction." That's technically misleading — extraction's registry
// is fetched server-side by api/chief.js. The frontend equivalent is
// boardStore.summary, which is what we read here. Logged as open item #15;
// spec text is scheduled for refresh post-Phase-4. Active vault projects
// (status active or lightweight) land in summary; archived projects do not —
// which is the correct set for orphan assignment.
//
// ─── Deviations from manifest (logged as open item #16) ───────────────────
// 1. When orphan.suggestedProjectName is present, BOTH a one-tap suggestion
//    row AND the free-form input row render. The manifest's "otherwise"
//    phrasing implies mutual exclusion, but offering both costs nothing and
//    lets the user override the suggestion in place.
// 2. The orphan's task text renders as a subhead under the title. The
//    manifest doesn't specify it; without it, a user picking across multiple
//    orphans loses track of which task they're assigning. Read live from the
//    store via useStore so inline edits in the review surface flow through.
//
// ─── UX behaviors ─────────────────────────────────────────────────────────
// - Backdrop tap, Escape key, × button: close with NO dispatch (orphan stays
//   unassigned). Tapping any option dispatches AND closes.
// - No background scroll-lock in v1.
// - Free-form input is always visible; no expand-on-tap, no auto-focus.
// - Safe-area inset on the sheet bottom for iOS home indicator.

import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { onboardStore, assignOrphan, deleteOrphan } from '../../state/onboard.js';
import { boardStore } from '../../state/board.js';
import './OrphanPicker.css';

export function OrphanPicker({ orphanTempId, onClose }) {
  const { extracted } = useStore(onboardStore);
  const { summary } = useStore(boardStore);
  const [newName, setNewName] = useState('');

  // Escape closes the picker without dispatching. Pattern matches MuseSheet.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Live orphan lookup — see deviation note 2 in the header for why this is
  // store-backed rather than prop-passed.
  const orphan = extracted?.orphanTasks?.find(o => o.tempId === orphanTempId);
  if (!orphan) return null;

  const existingProjects = summary || [];
  const extractedProjects = extracted?.projects || [];
  const suggestedName = orphan.suggestedProjectName;

  function pickExisting(projectId) {
    assignOrphan(orphanTempId, { kind: 'existing', existingId: projectId });
    onClose();
  }

  function pickExtracted(tempId) {
    assignOrphan(orphanTempId, { kind: 'new-extracted', projectTempId: tempId });
    onClose();
  }

  function pickSuggested() {
    assignOrphan(orphanTempId, { kind: 'new-adhoc', newName: suggestedName });
    onClose();
  }

  function submitNewName() {
    const trimmed = newName.trim();
    if (!trimmed) return; // empty input is a no-op, no dispatch, no close
    assignOrphan(orphanTempId, { kind: 'new-adhoc', newName: trimmed });
    onClose();
  }

  function pickDiscard() {
    deleteOrphan(orphanTempId);
    onClose();
  }

  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitNewName();
    }
  }

  return (
    <>
      <div
        class="op-backdrop"
        onClick={onClose}
        aria-hidden="true"
        data-testid="onboard-orphan-picker-backdrop"
      />
      <aside
        class="op-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Assign orphan task"
        data-testid="onboard-orphan-picker"
      >
        <header class="op-header">
          <span class="op-title">// WHERE DOES THIS GO?</span>
          <button
            type="button"
            class="op-close"
            aria-label="Close picker"
            onClick={onClose}
            data-testid="onboard-orphan-picker-close"
          >
            ×
          </button>
        </header>
        <div class="op-orphan-text">// {orphan.text}</div>

        <div class="op-body">
          {/* § 1 — existing vault projects. Hidden when summary is empty. */}
          {existingProjects.length > 0 && (
            <section class="op-section">
              <div
                class="op-section-header"
                data-testid="onboard-orphan-picker-section-existing"
              >
                IN EXISTING PROJECT
              </div>
              <ul class="op-list">
                {existingProjects.map((p) => (
                  <li key={p.project_id}>
                    <button
                      type="button"
                      class="op-row"
                      onClick={() => pickExisting(p.project_id)}
                      data-testid={`onboard-orphan-picker-option-existing-${p.project_id}`}
                    >
                      {p.project_name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* § 2 — extracted projects. Hidden when extracted.projects empty. */}
          {extractedProjects.length > 0 && (
            <section class="op-section">
              <div
                class="op-section-header"
                data-testid="onboard-orphan-picker-section-extracted"
              >
                IN A NEW PROJECT (FROM THIS CAPTURE)
              </div>
              <ul class="op-list">
                {extractedProjects.map((p) => (
                  <li key={p.tempId}>
                    <button
                      type="button"
                      class="op-row"
                      onClick={() => pickExtracted(p.tempId)}
                      data-testid={`onboard-orphan-picker-option-extracted-${p.tempId}`}
                    >
                      {p.name || '(unnamed)'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* § 3 — create new. Always rendered. Suggestion row coexists with
              the free-form input when a suggestion is present (see header
              comment, deviation 1). */}
          <section class="op-section">
            <div
              class="op-section-header"
              data-testid="onboard-orphan-picker-section-new"
            >
              AS A NEW PROJECT
            </div>
            {suggestedName && (
              <button
                type="button"
                class="op-row op-row--suggested"
                onClick={pickSuggested}
                data-testid="onboard-orphan-picker-option-new-suggested"
              >
                + NEW: {suggestedName}
              </button>
            )}
            <div class="op-new-input-row">
              <input
                type="text"
                class="op-new-input"
                placeholder="+ NEW PROJECT"
                value={newName}
                onInput={(e) => setNewName(e.currentTarget.value)}
                onKeyDown={onInputKeyDown}
                data-testid="onboard-orphan-picker-option-new-input"
              />
              <button
                type="button"
                class="op-new-submit"
                onClick={submitNewName}
                disabled={!newName.trim()}
                data-testid="onboard-orphan-picker-option-new-submit"
              >
                CREATE
              </button>
            </div>
          </section>

          {/* § 4 — discard. Always rendered. Single row, no header;
              op-section--discard provides visual separation via border-top. */}
          <section class="op-section op-section--discard">
            <button
              type="button"
              class="op-row op-row--danger"
              onClick={pickDiscard}
              data-testid="onboard-orphan-picker-option-discard"
            >
              DISCARD
            </button>
          </section>
        </div>
      </aside>
    </>
  );
}

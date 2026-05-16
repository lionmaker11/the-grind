// BacklogTaskRow — Phase 5b-5 modal task row + Phase 5b-6 inline edit.
//
// Mirrors Board's TaskRow (v2/src/components/Board/TaskRow.jsx) in shape
// but routes mutations through backlogStore instead of boardStore, and
// substitutes the launch button with a delete button per spec Decision 4
// (modal is a backlog management surface, not a task launcher).
//
// Gestures per phase5b-spec.md Decision 4 (4 interaction targets):
//   - Drag-handle: vertical reorder via lib/drag.js
//   - Task text: TAP to enter edit mode (5b-6); long-press 500ms to
//     toggle urgent (lib/longpress.js). longpress.js distinguishes tap
//     from hold via release-before-durationMs detection — no gesture
//     conflict. Same element, both callbacks wired.
//   - Check button: op:complete via backlogStore.completeTask
//   - Delete button: op:delete_task via backlogStore.deleteTask
//
// Long-press composition: longpress is on .backlog-task-text (text only,
// not handle). Drag is on .backlog-task-drag (handle only). Different
// elements, no gesture conflict. iOS Safari text-selection menu
// suppressed via user-select:none + -webkit-touch-callout:none on
// .backlog-task-text (5a-10 lesson; same suppression Board uses).
//
// Edit mode (5b-6) per spec Decision 7:
//   - Tap on task text → swap text div for <input type="text">
//   - Input autofocus + selects all content for fast retype
//   - Commit on Enter or blur
//   - Cancel on Escape, or if text is empty after trim, or if text
//     unchanged from current
//   - On save failure WHILE MODAL OPEN: row enters save-failed state
//     with red border + retry affordance. Per Daily-driver-tool hard
//     requirement (reviewer-context.md), failures MUST surface visibly
//     at row level when modal is still open.
//   - Closed-modal failures: silently swallowed (editText's generation
//     guard skips the store.error write when modal already cleared).
//     Pre-existing limitation documented in BACKLOG.md "Closed-modal
//     mutation failure swallowed (no user feedback)" — separate fix
//     when surfaced; out of 5b-6 scope.
//   - To reduce concurrent-mutator rollback risk (5b-3 BACKLOG entry,
//     elevated in 5b-5), check and delete buttons are DISABLED while
//     editing. Forces user to commit/cancel before destructive ops on
//     same row. Doesn't fully prevent the race (any two in-flight ops
//     on different rows can still trigger snapshot resurrection) but
//     blocks the most-likely trigger pattern.
//
// Visual polish deferrals (Council 4 5b-3 Decision 10 aspiration):
//   - Ghost-row drop indicator: drag.js doesn't currently render a
//     placeholder at drag origin. Would require drag.js extension that
//     ripples to Board's controller. Deferred to motion-polish sweep.
//   - Amber longpress-ring (1.2s fill): longpress.js doesn't render
//     visual progress. Existing .longpress-active outline (amber-glow
//     2px solid, applied by longpress.js automatically) provides
//     feedback. Ring deferred to motion-polish sweep.

import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { createLongPress } from '../../lib/longpress.js';
import { completeTask, toggleUrgent, deleteTask, editText } from '../../state/backlog.js';
import './BacklogTaskRow.css';

export function BacklogTaskRow({ task, tIdx, taskDrag }) {
  const [editing, setEditing] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Preserve the user's last-attempted text across save-failure rollback.
  // Council 4 5b-6 flagged: without this, retry's input defaults to
  // task.text (which is now rolled-back to pre-edit value), losing the
  // user's typed work. Solo-operator daily-driver friction unacceptable.
  const [lastAttempt, setLastAttempt] = useState(null);
  const inputRef = useRef(null);
  // Guard against double-commit: Enter → setEditing(false) → input
  // unmounts → blur fires during removal → second commitEdit. Codex
  // 5b-6 Phase 3 flagged. Reset to false when entering edit mode.
  const committingRef = useRef(false);
  // Lifecycle guard for async setSaveFailed after unmount. Codex 5b-6
  // Phase 3 flagged: editText promise can resolve after the row
  // unmounts (modal close, parent re-render that drops this row).
  // Preact's setState on unmounted component is a warning-only no-op,
  // but explicit guard is cleaner and prevents accidental future bugs.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Rebuild longpress instance when task.urgent or task.id changes —
  // callbacks close over current values. Same pattern as Board's
  // TaskRow; microsecond rebuild cost vs stale-closure bugs.
  const longpress = useMemo(
    () => createLongPress({
      onLongPress: () => toggleUrgent(task.id, !task.urgent),
      onTap: () => {
        // Don't enter edit mode if a save just failed — user should
        // see the failure indicator and retry via the explicit retry
        // affordance, not via a fresh tap that would mask the error.
        if (saveFailed) return;
        setEditing(true);
      },
    }),
    [task.id, task.urgent, saveFailed]
  );

  // Auto-focus + select-all on edit-mode entry. setTimeout(0) lets
  // Preact mount the input first; .focus() before mount is a no-op.
  // .select() puts the existing text in selected state so a fresh
  // type replaces it cleanly (alternative: position cursor at end
  // for append-style edits; select-all matches mobile expectation
  // when tapping a short label to edit it whole).
  //
  // Cleanup: clear pending timer if the effect re-runs OR component
  // unmounts before the timer fires. Codex 5b-6 flagged that an
  // un-cleaned timer can call focus/select on a detached element
  // (harmless but unclean) if the row unmounts during the 0ms tick.
  useEffect(() => {
    if (!editing || !inputRef.current) return undefined;
    const el = inputRef.current;
    const timerId = setTimeout(() => {
      // Guard: el may have detached between setTimeout schedule and fire.
      if (inputRef.current === el) {
        el.focus();
        el.select();
      }
    }, 0);
    return () => clearTimeout(timerId);
  }, [editing]);

  async function commitEdit() {
    // Double-commit guard: Enter handler calls commitEdit, then sets
    // editing=false, then input unmounts, then blur fires during
    // removal → second commitEdit. Without this guard, two editText
    // calls fire for one user intent.
    if (committingRef.current) return;
    committingRef.current = true;

    const raw = inputRef.current?.value || '';
    const cleaned = raw.trim().slice(0, 200);

    // Empty after trim → cancel silently (per spec Decision 7).
    // Unchanged → cancel silently (no network call needed).
    if (cleaned.length === 0 || cleaned === task.text) {
      setEditing(false);
      committingRef.current = false;
      return;
    }

    // Optimistic exit edit mode immediately — backlogStore.editText
    // updates the store synchronously so the row re-renders with
    // new text. Save-failure state set if the async call fails.
    setLastAttempt(cleaned); // preserve for retry if this fails
    setEditing(false);
    const result = await editText(task.id, cleaned);
    committingRef.current = false;
    if (result?.ok && mountedRef.current) {
      setLastAttempt(null); // success — clear the preserve
    } else if (!result?.ok && mountedRef.current) {
      setSaveFailed(true);
    }
  }

  function cancelEdit() {
    committingRef.current = false;
    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  function retryEdit() {
    setSaveFailed(false);
    committingRef.current = false;
    setEditing(true);
  }

  const rowClass = [
    'backlog-task-row',
    task.urgent ? 'urgent' : '',
    saveFailed ? 'save-failed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      {...taskDrag.itemProps(tIdx)}
      class={rowClass}
      data-testid={`backlog-task-${task.id}`}
    >
      <span
        {...taskDrag.handleProps(tIdx)}
        class={`backlog-task-drag${editing ? ' editing-suppressed' : ''}`}
        aria-label="Drag task to reorder"
        data-testid={`backlog-task-drag-${task.id}`}
      />
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          class="backlog-task-input"
          defaultValue={lastAttempt != null ? lastAttempt : task.text}
          maxLength={200}
          onKeyDown={onKeyDown}
          onBlur={commitEdit}
          data-testid={`backlog-task-input-${task.id}`}
          aria-label="Edit task text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
        />
      ) : (
        <div
          class="backlog-task-text wrap2"
          {...longpress.props()}
          data-testid={`backlog-task-text-${task.id}`}
        >
          {task.text}
        </div>
      )}
      {saveFailed && !editing && (
        <button
          type="button"
          class="backlog-task-retry"
          onClick={retryEdit}
          data-testid={`backlog-task-retry-${task.id}`}
          aria-label="Retry saving edit"
          title="Save failed — tap to retry"
        >↻ SAVE FAILED</button>
      )}
      <div class="backlog-task-actions">
        <button
          type="button"
          class="btn-icon check"
          aria-label="Complete task"
          disabled={editing}
          onClick={() => completeTask(task.id)}
          data-testid={`backlog-task-check-${task.id}`}
        >✓</button>
        <button
          type="button"
          class="btn-icon delete"
          aria-label="Delete task"
          disabled={editing}
          onClick={() => deleteTask(task.id)}
          data-testid={`backlog-task-delete-${task.id}`}
        >×</button>
      </div>
    </div>
  );
}

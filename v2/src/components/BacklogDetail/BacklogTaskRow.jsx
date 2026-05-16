// BacklogTaskRow — Phase 5b-5 modal task row.
//
// Mirrors Board's TaskRow (v2/src/components/Board/TaskRow.jsx) in shape
// but routes mutations through backlogStore instead of boardStore, and
// substitutes the launch button with a delete button per spec Decision 4
// (modal is a backlog management surface, not a task launcher).
//
// Gestures per phase5b-spec.md Decision 4 (4 interaction targets):
//   - Drag-handle: vertical reorder via lib/drag.js
//   - Task text: long-press 500ms to toggle urgent (lib/longpress.js).
//     Tap-to-edit lands in 5b-6.
//   - Check button: op:complete via backlogStore.completeTask
//   - Delete button: op:delete_task via backlogStore.deleteTask
//
// Long-press composition: longpress is on .backlog-task-text (text only,
// not handle). Drag is on .backlog-task-drag (handle only). Different
// elements, no gesture conflict. iOS Safari text-selection menu
// suppressed via user-select:none + -webkit-touch-callout:none on
// .backlog-task-text (5a-10 lesson; same suppression Board uses).
//
// Visual polish deferrals (Council 4 5b-3 Decision 10 aspiration):
//   - Ghost-row drop indicator: drag.js doesn't currently render a
//     placeholder at drag origin. Would require drag.js extension that
//     ripples to Board's controller. Deferred to motion-polish sweep.
//   - Amber longpress-ring (1.2s fill): longpress.js doesn't render
//     visual progress. Existing .longpress-active outline (amber-glow
//     2px solid, applied by longpress.js automatically) provides
//     feedback. Ring deferred to motion-polish sweep.

import { useMemo } from 'preact/hooks';
import { createLongPress } from '../../lib/longpress.js';
import { completeTask, toggleUrgent, deleteTask } from '../../state/backlog.js';
import './BacklogTaskRow.css';

export function BacklogTaskRow({ task, tIdx, taskDrag }) {
  // Rebuild longpress instance when task.urgent changes — callback
  // closes over current value and dispatches the flipped state. Same
  // pattern as Board's TaskRow; microsecond rebuild cost vs stale-
  // closure bug on rapid double-taps.
  const longpress = useMemo(
    () => createLongPress({
      onLongPress: () => toggleUrgent(task.id, !task.urgent),
    }),
    [task.id, task.urgent]
  );

  return (
    <div
      {...taskDrag.itemProps(tIdx)}
      class={`backlog-task-row${task.urgent ? ' urgent' : ''}`}
      data-testid={`backlog-task-${task.id}`}
    >
      <span
        {...taskDrag.handleProps(tIdx)}
        class="backlog-task-drag"
        aria-label="Drag task to reorder"
        data-testid={`backlog-task-drag-${task.id}`}
      />
      <div
        class="backlog-task-text wrap2"
        {...longpress.props()}
        data-testid={`backlog-task-text-${task.id}`}
      >
        {task.text}
      </div>
      <div class="backlog-task-actions">
        <button
          type="button"
          class="btn-icon check"
          aria-label="Complete task"
          onClick={() => completeTask(task.id)}
          data-testid={`backlog-task-check-${task.id}`}
        >✓</button>
        <button
          type="button"
          class="btn-icon delete"
          aria-label="Delete task"
          onClick={() => deleteTask(task.id)}
          data-testid={`backlog-task-delete-${task.id}`}
        >×</button>
      </div>
    </div>
  );
}

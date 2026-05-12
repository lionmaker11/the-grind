import { useMemo } from 'preact/hooks';
import { createLongPress } from '../../lib/longpress.js';
import { completeTask, toggleTaskUrgent, launchTask } from '../../state/board.js';
import './TaskRow.css';

// Board task row — rebuilt in 5a-6 from the Phase 2 placeholder.
//
// Composes lib/longpress.js on .task-text (urgent toggle) and
// lib/drag.js handle bindings on .drag-handle (vertical reorder).
// The two gestures live on different elements so there's no
// composition collision — drag.handleProps + longpress.props on the
// same element is supported by both libs (see their headers) but we
// don't need it here. .task-text is the long-press target only.
//
// The longpress useMemo deps include task.urgent because the
// onLongPress callback closes over the current value and dispatches
// the flipped state. Rebuilding the instance on every toggle is
// microseconds — trivial vs the alternative of a stale-closure bug
// where rapid double-taps would all dispatch the same boolean.
//
// taskDrag is now always provided by ProjectCard (gap closed in
// 5a-7); spreads are unconditional. Component assumes a valid
// controller and would throw if rendered without one — that's a
// programming error, not a runtime case.
export function TaskRow({ projectId, task, tIdx, taskDrag }) {
  const longpress = useMemo(
    () => createLongPress({
      onLongPress: () => toggleTaskUrgent(projectId, task.id, !task.urgent),
    }),
    [projectId, task.id, task.urgent]
  );

  return (
    <div
      {...taskDrag.itemProps(tIdx)}
      class={`task-row wrap2${task.urgent ? ' urgent' : ''}`}
      data-testid={`board-task-${task.id}`}
    >
      <span
        {...taskDrag.handleProps(tIdx)}
        class="drag-handle"
        aria-label="Drag task to reorder"
        data-testid={`board-task-drag-${task.id}`}
      />
      <div
        class="task-text wrap2"
        {...longpress.props()}
        data-testid={`board-task-text-${task.id}`}
      >
        {task.text}
      </div>
      <div class="task-actions">
        <button
          type="button"
          class="btn-icon launch"
          aria-label="Launch task into Focus"
          onClick={() => launchTask(projectId, task.id)}
          data-testid={`board-task-launch-${task.id}`}
        >▶</button>
        <button
          type="button"
          class="btn-icon check"
          aria-label="Complete task"
          onClick={() => completeTask(projectId, task.id)}
          data-testid={`board-task-check-${task.id}`}
        >✓</button>
      </div>
    </div>
  );
}

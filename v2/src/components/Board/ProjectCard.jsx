import { useMemo, useEffect } from 'preact/hooks';
import { createListDragController } from '../../lib/drag.js';
import { reorderTopThree, boardStore } from '../../state/board.js';
import { HeartbeatDot } from './HeartbeatDot.jsx';
import { TaskRow } from './TaskRow.jsx';
import './ProjectCard.css';

export function ProjectCard({ project }) {
  const top = project.top || [];
  const urgentCount = project.urgent_count || 0;
  const totalCount = project.task_count || 0;
  const name = (project.project_name || '').toUpperCase();

  // Drag controller — one per project. Keyed on project_id so the
  // controller identity is stable across boardStore re-renders (any
  // mutator firing causes summary[] to be replaced by reference; the
  // useMemo dep is just the ID, so the controller survives unless
  // the project itself goes away).
  //
  // Drag callback reads CURRENT project.top from boardStore.get() at
  // fire time — NOT via closure capture of `project` from render —
  // because the captured prop reflects render-time state and may be
  // stale by the time the user releases the drag (fetchBoard could
  // have fired, or another mutator updated summary). Reading from
  // the store at fire time guarantees we splice against the same IDs
  // the user actually saw at release.
  //
  // Known gap: if fetchBoard replaces top[] entirely mid-drag (e.g.,
  // post-Muse-action refetch), the from/to indices stored by drag.js
  // may point to different tasks than they did at drag start. The
  // bounds check below catches the list-shrunk case; a full fix
  // requires extending drag.js with onDragStart (would ripple to
  // OnboardReview). Logged in PHASES.md Phase 5a polish list;
  // phone test (5a-11) verifies before 5a-12 merge decides.
  const taskDrag = useMemo(
    () => createListDragController({
      onReorder: (from, to) => {
        const current = boardStore.get().summary.find(
          p => p.project_id === project.project_id
        );
        if (!current) return;
        const currentIds = (current.top || []).map(t => t.id);
        if (from < 0 || from >= currentIds.length) return;
        if (to < 0 || to >= currentIds.length) return;
        const newIds = [...currentIds];
        const [moved] = newIds.splice(from, 1);
        newIds.splice(to, 0, moved);
        reorderTopThree(project.project_id, newIds);
      },
    }),
    [project.project_id]
  );

  useEffect(() => () => taskDrag.destroy(), [taskDrag]);

  return (
    <div class="panel project-card">
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />
      <div class="project-head">
        <HeartbeatDot lastTouched={project.last_touched} />
        <span class="project-name">{name}</span>
        <span class={`urgent-count${urgentCount === 0 ? ' urgent-count--zero' : ''}`}>
          <span class="n-urgent">{urgentCount} URGENT</span>
          <span class="slash">/</span>
          {totalCount}
        </span>
      </div>
      {top.length === 0
        ? <div class="task-empty">// empty</div>
        : top.map((task, i) => (
            <TaskRow
              key={task.id}
              projectId={project.project_id}
              task={task}
              tIdx={i}
              taskDrag={taskDrag}
            />
          ))}
    </div>
  );
}

import { HeartbeatDot } from './HeartbeatDot.jsx';
import { TaskRow } from './TaskRow.jsx';
import { daysSince } from '../../lib/heartbeat.js';
import './ProjectCard.css';

export function ProjectCard({ project }) {
  const days = daysSince(project.last_touched);
  const pending = project.task_count || 0;
  const daysLabel = days == null ? '—' : `${days}D`;
  const top = project.top || [];
  const name = (project.project_name || '').toUpperCase();

  return (
    <div class="panel project-card">
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />
      <div class="project-head">
        <HeartbeatDot lastTouched={project.last_touched} />
        <span class="project-name">{name}</span>
        <span class="project-meta">{daysLabel} · {pending} PENDING</span>
      </div>
      {top.length === 0
        ? <div class="task-empty">// empty</div>
        : top.map((task) => <TaskRow key={task.id} task={task} />)}
    </div>
  );
}

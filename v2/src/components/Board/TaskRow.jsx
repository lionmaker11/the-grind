import './TaskRow.css';

export function TaskRow({ task }) {
  const pri = task.priority || 5;
  return (
    <div class="task-row">
      <span class={`p-badge p${pri}`} aria-label={`Priority ${pri}`}>P{pri}</span>
      <div class="task-body">
        <div class="task-text">{task.text}</div>
      </div>
      <div class="task-actions">
        <button class="btn-icon launch" type="button" aria-label="Launch">▶</button>
        <button class="btn-icon check" type="button" aria-label="Complete">✓</button>
      </div>
    </div>
  );
}

// Review screen — editable project/task list + pinned LOCK IT IN dock.
// Edits dispatch into onboardStore (no local form state). Commit fires
// commitOnboardingResults() which orchestrates the real API calls.

import { useStore } from '@nanostores/preact';
import {
  onboardStore,
  editProjectName,
  editProjectPriority,
  deleteProject,
  addProject,
  editTaskText,
  editTaskPriority,
  deleteTask,
  addTask,
  startCommit,
  commitOnboardingResults
} from '../../state/onboard.js';
import { TopBar } from '../TopBar/TopBar.jsx';
import './OnboardReview.css';

function PriorityBadge({ value, onDec, onInc }) {
  const cls = `p-badge p${Math.min(Math.max(value || 3, 1), 5)}`;
  return (
    <div class="or-pri">
      <button type="button" class="or-pri-step" aria-label="Raise priority" onClick={onDec} tabIndex={-1}>▲</button>
      <span class={cls}>P{value}</span>
      <button type="button" class="or-pri-step" aria-label="Lower priority" onClick={onInc} tabIndex={-1}>▼</button>
    </div>
  );
}

function TaskRow({ projectIdx, taskIdx, task }) {
  return (
    <div class="task-row">
      <PriorityBadge
        value={task.priority}
        onDec={() => editTaskPriority(projectIdx, taskIdx, Math.max(1, (task.priority || 3) - 1))}
        onInc={() => editTaskPriority(projectIdx, taskIdx, Math.min(5, (task.priority || 3) + 1))}
      />
      <input
        type="text"
        class="or-task-text"
        value={task.text || ''}
        placeholder="Task…"
        onInput={(e) => editTaskText(projectIdx, taskIdx, e.currentTarget.value)}
        data-testid={`onboard-task-${projectIdx}-${taskIdx}`}
      />
      <button
        type="button"
        class="btn-icon delete"
        aria-label="Delete task"
        onClick={() => deleteTask(projectIdx, taskIdx)}
      >
        ×
      </button>
    </div>
  );
}

function ProjectPanel({ project, idx }) {
  return (
    <div class="panel project-card or-panel" data-testid={`onboard-project-${idx}`}>
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />
      <div class="project-head">
        <span class="or-heartbeat" />
        <input
          type="text"
          class="or-project-name"
          value={project.name || ''}
          placeholder="PROJECT NAME"
          onInput={(e) => editProjectName(idx, e.currentTarget.value)}
          data-testid={`onboard-project-name-${idx}`}
        />
        <PriorityBadge
          value={project.priority}
          onDec={() => editProjectPriority(idx, Math.max(1, (project.priority || 3) - 1))}
          onInc={() => editProjectPriority(idx, Math.min(5, (project.priority || 3) + 1))}
        />
        <button
          type="button"
          class="btn-icon delete"
          aria-label="Delete project"
          onClick={() => deleteProject(idx)}
        >
          ×
        </button>
      </div>
      {(project.tasks || []).map((t, tIdx) => (
        <TaskRow key={t.tempId || `t-${tIdx}`} projectIdx={idx} taskIdx={tIdx} task={t} />
      ))}
      <button
        type="button"
        class="add-task-ghost"
        onClick={() => addTask(idx)}
        data-testid={`onboard-add-task-${idx}`}
      >
        + ADD TASK
      </button>
    </div>
  );
}

export function OnboardReview() {
  const { step, extracted, committing, commitProgress } = useStore(onboardStore);
  const projects = extracted?.projects || [];
  const inProgress = step === 'committing';
  const { total, completed, failed } = commitProgress;

  function handleLock() {
    if (committing) return;
    startCommit();
    commitOnboardingResults();
  }

  const lockLabel = inProgress
    ? (total > 0 ? `LOCKING IN · ${completed} / ${total}` : 'LOCKING IN…')
    : 'LOCK IT IN ▶';

  return (
    <>
      <TopBar />
      <div class="or-viewport">
        <div class="review-eyebrow">
          ➤ // HERE&apos;S WHAT I FILED.
          <br />FIX ANYTHING THAT&apos;S WRONG.
        </div>
        {projects.length === 0 && (
          <div class="or-empty">
            // Nothing extracted. Add a project below or exit to retry.
          </div>
        )}
        {projects.map((p, i) => (
          <ProjectPanel key={p.tempId || `p-${i}`} project={p} idx={i} />
        ))}
        <button
          type="button"
          class="add-project-ghost"
          onClick={addProject}
          data-testid="onboard-add-project"
        >
          + ADD PROJECT
        </button>
        {failed.length > 0 && !inProgress && (
          <div class="or-partial-warn" role="alert">
            // {failed.length} item{failed.length === 1 ? '' : 's'} failed. Retry to try again.
          </div>
        )}
      </div>
      <div class="lock-dock">
        <button
          type="button"
          class="review-lock"
          onClick={handleLock}
          disabled={inProgress || projects.length === 0}
          data-testid="onboard-lock-in"
        >
          {lockLabel}
        </button>
      </div>
    </>
  );
}

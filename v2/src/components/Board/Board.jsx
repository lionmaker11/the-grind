import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { boardStore, fetchBoard, launchTask } from '../../state/board.js';
import { museStore, open as museOpen } from '../../state/muse.js';
import { ProjectCard } from './ProjectCard.jsx';
import { EmptyState } from './EmptyState.jsx';
import './Board.css';

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Returns the first task in the first project after the backend's
// urgent-first sort (per phase5a-spec.md Decision 4). Returns null
// if summary is empty OR if no project has a non-empty top[]. Used
// as both the render gate and launch target for EXECUTE — the
// button only renders when there's something to launch, and the
// onClick reads the same target from the same helper, so render
// and dispatch never disagree.
//
// .find(Boolean) instead of [0] per Codex 5a-7 review (NIT): defends
// against sparse/null entries in top[] without changing behavior
// for dense responses. Backend response is dense, but the cost is
// one character.
function topMostTask(summary) {
  if (!Array.isArray(summary) || summary.length === 0) return null;
  for (const p of summary) {
    const task = (p.top || []).find(Boolean);
    if (task) {
      return { projectId: p.project_id, id: task.id, text: task.text };
    }
  }
  return null;
}

export function Board() {
  const { summary, loading, error, lastFetchAt } = useStore(boardStore);
  const { lastActionAt } = useStore(museStore);
  const lastSeenActionAt = useRef(0);

  useEffect(() => { fetchBoard(); }, []);

  // Re-fetch board after Muse dispatches any vault mutation.
  useEffect(() => {
    if (lastActionAt && lastActionAt !== lastSeenActionAt.current) {
      lastSeenActionAt.current = lastActionAt;
      fetchBoard();
    }
  }, [lastActionAt]);

  if (loading && !error && summary.length === 0) return null;

  const isOffline = error !== null;
  const allEmpty = summary.length === 0 || summary.every((p) => (p.top || []).length === 0);
  const execTarget = topMostTask(summary);

  if (isOffline) {
    const syncLabel = lastFetchAt
      ? `CACHED · LAST SYNC ${formatTime(lastFetchAt)}`
      : 'CACHED · NO SYNC YET';
    return (
      <main class="board">
        <div class="section-title">IN CONTEXT</div>
        <div class="section-sub section-sub--offline">{syncLabel}</div>
        {summary.map((p) => <ProjectCard key={p.project_id} project={p} />)}
        <div class="muse-offline-note">// MUSE OFFLINE — voice filing paused</div>
        {execTarget && (
          <div class="execute-wrap">
            <button
              class="btn-primary"
              type="button"
              onClick={() => launchTask(execTarget.projectId, execTarget.id)}
              data-testid="board-execute"
            >
              <span aria-hidden="true">▶ </span>EXECUTE
            </button>
          </div>
        )}
      </main>
    );
  }

  if (allEmpty) {
    return (
      <main class="board">
        <div class="section-title">IN CONTEXT</div>
        <div class="section-sub">0 PENDING · BOARD CLEAR</div>
        <EmptyState />
      </main>
    );
  }

  const totalPending = summary.reduce((n, p) => n + (p.task_count || 0), 0);

  return (
    <main class="board">
      <div class="section-title">IN CONTEXT</div>
      <div class="section-sub">{summary.length} PROJECTS · {totalPending} PENDING</div>
      {summary.map((p) => <ProjectCard key={p.project_id} project={p} />)}
      <button
        class="add-project-ghost"
        type="button"
        onClick={() => museOpen({ prefill: 'new project: ' })}
      >
        <span aria-hidden="true">+ </span>NEW PROJECT
      </button>
      {execTarget && (
        <div class="execute-wrap">
          <button
            class="btn-primary"
            type="button"
            onClick={() => launchTask(execTarget.projectId, execTarget.id)}
            data-testid="board-execute"
          >
            <span aria-hidden="true">▶ </span>EXECUTE
          </button>
        </div>
      )}
    </main>
  );
}

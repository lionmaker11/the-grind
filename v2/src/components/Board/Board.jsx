import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { boardStore, fetchBoard } from '../../state/board.js';
import { ProjectCard } from './ProjectCard.jsx';
import { EmptyState } from './EmptyState.jsx';
import './Board.css';

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function Board() {
  const { summary, loading, error, lastFetchAt } = useStore(boardStore);

  useEffect(() => { fetchBoard(); }, []);

  if (loading && !error && summary.length === 0) return null;

  const isOffline = error !== null;
  const allEmpty = summary.length === 0 || summary.every((p) => (p.top || []).length === 0);

  if (isOffline) {
    const syncLabel = lastFetchAt
      ? `CACHED · LAST SYNC ${formatTime(lastFetchAt)}`
      : 'CACHED · NO SYNC YET';
    return (
      <div class="board">
        <div class="section-title">IN CONTEXT</div>
        <div class="section-sub section-sub--offline">{syncLabel}</div>
        {summary.map((p) => <ProjectCard key={p.project_id} project={p} />)}
        <div class="muse-offline-note">// MUSE OFFLINE — voice filing paused</div>
        <div class="execute-wrap"><button class="btn-primary" type="button">▶ EXECUTE</button></div>
        <div class="muse-fab dimmed" aria-hidden="true">●</div>
      </div>
    );
  }

  if (allEmpty) {
    return (
      <div class="board">
        <div class="section-title">IN CONTEXT</div>
        <div class="section-sub">0 PENDING · BOARD CLEAR</div>
        <EmptyState />
        <div class="muse-fab" aria-hidden="true">●</div>
      </div>
    );
  }

  const totalPending = summary.reduce((n, p) => n + (p.task_count || 0), 0);

  return (
    <div class="board">
      <div class="section-title">IN CONTEXT</div>
      <div class="section-sub">{summary.length} PROJECTS · {totalPending} PENDING</div>
      {summary.map((p) => <ProjectCard key={p.project_id} project={p} />)}
      <button class="add-project-ghost" type="button">+ NEW PROJECT</button>
      <div class="execute-wrap"><button class="btn-primary" type="button">▶ EXECUTE</button></div>
      <div class="muse-fab" aria-hidden="true">●</div>
    </div>
  );
}

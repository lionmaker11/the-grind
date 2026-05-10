// Board state store. First nanostore in the codebase. Holds the summary
// returned by GET /api/backlog plus loading/error flags.
//
// Mutators (added Phase 5a-4) follow an optimistic-update + rollback
// convention — no prior art in the codebase, established here:
//   (1) capture snapshot of summary,
//   (2) compute optimistic new summary immutably (.map() to new arrays
//       and new objects; never in-place mutation — subscribers via
//       useStore key off identity changes),
//   (3) write to store via setKey/set (never direct property writes),
//   (4) await the backlogOp call,
//   (5) on error: restore from snapshot, set error, and fetchBoard() to
//       recover authoritative state from server.
//
// On success: trust the optimistic update; no re-fetch. Re-fetching
// after every successful op floods the backend and adds user-perceived
// latency for no benefit (per phase5a-spec.md State changes section).
// Cross-surface sync (e.g. Muse files a new task while Board is open)
// is covered by the existing post-Muse-action re-fetch in Board.jsx.
//
// Mutators do NOT flip the `loading` flag — that's semantically
// reserved for initial load. An optimistic operation already has data
// on screen.
//
// Errors stored as String(e?.message || e), matching fetchBoard's
// convention. TopBar reads `error` and renders an offline indicator
// when it's non-null; on a failed mutator, the indicator surfaces
// briefly until fetchBoard()'s success path clears it.

import { map } from 'nanostores';
import { getBacklog, backlogOp } from '../lib/api.js';
import { setActive as setFocusActive } from './focus.js';

export const boardStore = map({
  summary: [],
  loading: true,
  error: null,
  lastFetchAt: null
});

export async function fetchBoard() {
  boardStore.setKey('loading', true);
  try {
    const data = await getBacklog();
    boardStore.set({
      summary: Array.isArray(data?.summary) ? data.summary : [],
      loading: false,
      error: null,
      lastFetchAt: Date.now()
    });
  } catch (e) {
    boardStore.setKey('loading', false);
    boardStore.setKey('error', String(e?.message || e));
  }
}

// Re-sort a project's top[] urgent-first, then by priority ascending,
// preserving stable order within equal urgent+priority. Mirrors
// api/_lib/vault.js sortByPriority (5a-3) so the optimistic update
// after toggleTaskUrgent matches what the next backend fetch would
// return — otherwise the toggled task stays in place visually until
// next fetch, then jumps to top (jarring).
function sortTopUrgentFirst(top) {
  return [...(top || [])]
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const ua = Boolean(a.t.urgent);
      const ub = Boolean(b.t.urgent);
      if (ua !== ub) return ua ? -1 : 1;
      const pa = a.t.priority == null ? 99 : a.t.priority;
      const pb = b.t.priority == null ? 99 : b.t.priority;
      if (pa !== pb) return pa - pb;
      return a.i - b.i;
    })
    .map(x => x.t);
}

export async function completeTask(projectId, taskId) {
  const before = boardStore.get();
  const snapshot = before.summary;

  const optimistic = snapshot.map(p =>
    p.project_id === projectId
      ? {
          ...p,
          top: (p.top || []).filter(t => t.id !== taskId),
          task_count: Math.max(0, (p.task_count || 0) - 1)
        }
      : p
  );

  boardStore.setKey('summary', optimistic);

  try {
    await backlogOp({ op: 'complete', project_id: projectId, task_id: taskId });
  } catch (e) {
    boardStore.set({
      ...boardStore.get(),
      summary: snapshot,
      error: String(e?.message || e)
    });
    fetchBoard();
  }
}

export async function toggleTaskUrgent(projectId, taskId, urgent) {
  const before = boardStore.get();
  const snapshot = before.summary;

  const optimistic = snapshot.map(p =>
    p.project_id === projectId
      ? {
          ...p,
          top: sortTopUrgentFirst(
            (p.top || []).map(t =>
              t.id === taskId ? { ...t, urgent: Boolean(urgent) } : t
            )
          )
        }
      : p
  );

  boardStore.setKey('summary', optimistic);

  try {
    await backlogOp({ op: 'toggle_urgent', project_id: projectId, task_id: taskId, urgent: Boolean(urgent) });
  } catch (e) {
    boardStore.set({
      ...boardStore.get(),
      summary: snapshot,
      error: String(e?.message || e)
    });
    fetchBoard();
  }
}

export async function reorderTopThree(projectId, newOrderIds) {
  const before = boardStore.get();
  const snapshot = before.summary;

  const project = snapshot.find(p => p.project_id === projectId);
  if (!project) return; // No-op if project not found (defensive)

  const taskById = Object.fromEntries((project.top || []).map(t => [t.id, t]));
  const newTop = newOrderIds.map(id => taskById[id]).filter(Boolean);

  // Defensive: if newTop length doesn't match newOrderIds length, caller
  // sent IDs not in current top[]. Bail without mutating.
  if (newTop.length !== newOrderIds.length) return;

  const optimistic = snapshot.map(p =>
    p.project_id === projectId ? { ...p, top: newTop } : p
  );

  boardStore.setKey('summary', optimistic);

  try {
    await backlogOp({ op: 'reorder', project_id: projectId, order: newOrderIds });
  } catch (e) {
    boardStore.set({
      ...boardStore.get(),
      summary: snapshot,
      error: String(e?.message || e)
    });
    fetchBoard();
  }
}

// ─── launchTask — non-mutating; routes to Focus stub ──────────────
//
// Looks up task text from current boardStore summary by (projectId,
// taskId) and dispatches focusStore.setActive. No backend call. No
// boardStore mutation. App.jsx render switch picks up the focusStore
// change and mounts <Focus />.
//
// Defensive bail-out if project or task not found (stale state from
// concurrent fetchBoard or component-render race). Caller (TaskRow's
// ▶ button, Board.jsx's EXECUTE button) is expected to pass valid
// IDs from current render state.
export function launchTask(projectId, taskId) {
  const { summary } = boardStore.get();
  const project = summary.find(p => p.project_id === projectId);
  if (!project) return;
  const task = (project.top || []).find(t => t.id === taskId);
  if (!task) return;
  setFocusActive(taskId, task.text, projectId);
}

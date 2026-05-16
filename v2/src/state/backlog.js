// Backlog detail modal state — Phase 5b nanostore.
//
// Distinct from boardStore: boardStore holds the multi-project summary
// shape (top-3 only) returned by GET /api/backlog. backlogStore holds
// the full task list for ONE project at a time, fetched via GET
// /api/backlog?project_id=X. Modal opens → openProject() fetches and
// mounts. Modal closes → close() clears state.
//
// Mutator convention inherits from boardStore (Phase 5a-4):
//   (1) capture snapshot of tasks (+ counts) and current generation
//   (2) compute optimistic new array immutably (.map() / .filter() to
//       new arrays and new objects; never in-place mutation —
//       subscribers via useStore key off identity changes)
//   (3) write to store via setKey/set (never direct property writes)
//   (4) await the backlogOp call
//   (5) on error AND if generation still matches: restore from snapshot,
//       set error
//   (6) on success: trigger fetchBoard() so Board's top-3 stays in sync
//       with modal-originated mutations (cross-store propagation)
//
// Generation guard (Codex 5b-3 finding):
//   `generation` increments on every openProject() and close(). Mutators
//   capture the generation at start; post-await writes check it. If the
//   generation has changed (modal closed, or different project opened),
//   the mutator silently aborts its store write. Prevents stale async
//   writes from corrupting a closed or re-opened modal.
//
// Concurrent same-modal mutator rollback (deferred):
//   If two mutators run concurrently (e.g. completeTask(A) succeeds,
//   then toggleUrgent(A) which started before fails), the failing
//   mutator's whole-array snapshot restore can resurrect A. This is
//   logged in BACKLOG.md; patch-based rollback is the proper fix.
//   Single-user single-tenant scope makes this low-frequency in
//   practice — defer to dogfood signal.
//
// Pre-rebuild tasks (no urgent field) are sorted as urgent:false via
// Boolean(t.urgent) coercion — matches sortByPriority in api/_lib/vault.js
// and sortTopUrgentFirst in board.js. Three copies of this sort now exist
// (vault.js, board.js, this file) — extract to lib/sort.js when a fourth
// surface needs it (Phase 6 likely).
//
// Codex 5b-2 forward-looking note: optimistic mutators MUST merge by
// task.id, not blindly assign response.task. Pattern below uses
// .map(t => t.id === id ? { ...t, ...patch } : t).
//
// reorder() DRAG-LAYER CONTRACT (Council 4 / 5b-3):
//   newOrderIds MUST be a full-list payload — every task currently in
//   the modal's tasks array, in the new order. Partial subarrays,
//   duplicates, or unknown ids are rejected (no-op). 5b-5 (TaskRow
//   inside BacklogDetail) implementing drag must construct the full
//   ordered id list before calling reorder(). This couples backlogStore
//   to a specific drag.js usage pattern but keeps the optimistic
//   reorder safe from malformed drag payloads.

import { map } from 'nanostores';
import { getProjectBacklog, backlogOp } from '../lib/api.js';
import { fetchBoard } from './board.js';

export const backlogStore = map({
  openProjectId: null,
  tasks: [],
  projectName: '',
  taskCount: 0,
  urgentCount: 0,
  loading: false,
  error: null
});

// Monotonic generation counter. Bumped on every modal open/close.
// Mutators capture at start and check post-await. NOT exposed in the
// store payload (consumers don't need it; only the module needs it).
let generation = 0;

// ─── sort helpers ────────────────────────────────────────────────────

// Urgent-first, then priority asc, stable within equal urgent+priority.
// Mirrors api/_lib/vault.js sortByPriority and board.js sortTopUrgentFirst
// (see header comment re: triplication).
function sortUrgentFirst(tasks) {
  return [...(tasks || [])]
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

// Filter to pending tasks (status !== 'done') and apply urgent-first
// sort. The modal renders only pending tasks; done tasks stay in vault
// for history (per api/backlog.js op:complete behavior) but aren't
// surfaced in the UI. Used by openProject() and any mutator that
// reshapes the array.
function preparePending(rawTasks) {
  const pending = (rawTasks || []).filter(t => t.status !== 'done');
  return sortUrgentFirst(pending);
}

function deriveCounts(tasks) {
  return {
    taskCount: tasks.length,
    urgentCount: tasks.filter(t => Boolean(t.urgent)).length
  };
}

// Mirror api/backlog.js assignBucketedPriorities (line 96): assign
// priorities 1..5 evenly across the reordered array. ≤5 tasks get
// position-based priority; >5 tasks bucket into 5 groups. Optimistic
// reorder uses this so subsequent sortUrgentFirst() calls see the
// same priority values the server wrote — otherwise dragged tasks
// might re-shuffle on the next urgent-toggle's resort.
function assignBucketedPriorities(tasks) {
  const n = tasks.length;
  if (n === 0) return tasks;
  return tasks.map((t, i) => {
    let priority;
    if (n <= 5) {
      priority = i + 1;
    } else {
      priority = Math.floor((i * 5) / n) + 1;
    }
    return { ...t, priority };
  });
}

// ─── lifecycle ───────────────────────────────────────────────────────

export async function openProject(projectId) {
  // Defensive: reject empty/null/undefined projectId. Caller (chevron
  // tap handler) is expected to pass a real project_id from board
  // state, but a stale render or null prop could otherwise mount the
  // modal with an unusable openProjectId. Codex 5b-3 Phase 3 flagged.
  if (!projectId || typeof projectId !== 'string') return;

  // Bump generation: any in-flight mutator from a previous project (or
  // a previous open of this same project) will see a stale generation
  // post-await and abort its write.
  const myGen = ++generation;

  // Mount the modal immediately with loading state. Spec: progressive
  // disclosure — user sees the modal frame mounted, header populates
  // with placeholder, list shows loading. Avoids the "tap → nothing →
  // modal appears 200ms later" feel.
  backlogStore.set({
    openProjectId: projectId,
    tasks: [],
    projectName: '',
    taskCount: 0,
    urgentCount: 0,
    loading: true,
    error: null
  });

  try {
    const data = await getProjectBacklog(projectId);
    if (myGen !== generation) return; // modal closed or new project opened
    const raw = data?.backlog;
    if (!raw) throw new Error('Empty backlog response');
    const tasks = preparePending(raw.tasks);
    const { taskCount, urgentCount } = deriveCounts(tasks);
    backlogStore.set({
      openProjectId: projectId,
      tasks,
      projectName: raw.project_name || projectId,
      taskCount,
      urgentCount,
      loading: false,
      error: null
    });
  } catch (e) {
    if (myGen !== generation) return; // generation expired
    // Keep openProjectId set so the modal stays mounted with an error
    // message rather than dismissing without explanation.
    backlogStore.setKey('loading', false);
    backlogStore.setKey('error', String(e?.message || e));
  }
}

export function close() {
  generation++; // expire any in-flight mutators
  backlogStore.set({
    openProjectId: null,
    tasks: [],
    projectName: '',
    taskCount: 0,
    urgentCount: 0,
    loading: false,
    error: null
  });
  // Cross-surface sync. Each successful mutator already calls fetchBoard()
  // (see post-success blocks below), so by the time close() fires Board
  // has already received the most recent edits. close() runs one final
  // fetchBoard() as belt-and-suspenders for any user who never landed a
  // mutation but did open the modal — keeps Board's stale-data window
  // bounded.
  fetchBoard();
}

// Variant of close() used by onboard lifecycle (openOnboard / closeOnboard)
// to clear modal state without triggering a Board refresh. Onboard owns
// its own transitions and will fetchBoard at its 'done' step, so we
// avoid the redundant fetch + race window. Codex 5b-4 Phase 3 flagged
// that closeOnboard was clearing Focus but not BacklogDetail, leaving
// modal armed behind an active onboard session.
export function clearBacklog() {
  generation++; // expire any in-flight mutators
  backlogStore.set({
    openProjectId: null,
    tasks: [],
    projectName: '',
    taskCount: 0,
    urgentCount: 0,
    loading: false,
    error: null
  });
}

// ─── mutators ────────────────────────────────────────────────────────

export async function completeTask(taskId) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const snapshot = before.tasks;

  const optimistic = snapshot.filter(t => t.id !== taskId);
  const { taskCount, urgentCount } = deriveCounts(optimistic);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    taskCount,
    urgentCount,
    error: null // clear any previous error on new mutation
  });

  try {
    await backlogOp({ op: 'complete', project_id: projectId, task_id: taskId });
    // fetchBoard fires UNCONDITIONALLY on success — backend committed
    // the change regardless of whether modal is still open. Generation
    // guard only suppresses the modal-store write, not cross-store sync
    // (Codex 5b-3 Phase 3 finding: closed-modal mutations were hidden
    // from Board until next unrelated fetch).
    fetchBoard();
  } catch (e) {
    if (myGen !== generation) return; // modal closed; abandon rollback
    backlogStore.set({
      ...backlogStore.get(),
      tasks: snapshot,
      ...deriveCounts(snapshot),
      error: String(e?.message || e)
    });
  }
}

export async function toggleUrgent(taskId, urgent) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const snapshot = before.tasks;
  const willBeUrgent = Boolean(urgent);

  const patched = snapshot.map(t =>
    t.id === taskId ? { ...t, urgent: willBeUrgent } : t
  );
  const optimistic = sortUrgentFirst(patched);
  const { taskCount, urgentCount } = deriveCounts(optimistic);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    taskCount,
    urgentCount,
    error: null
  });

  try {
    await backlogOp({
      op: 'toggle_urgent',
      project_id: projectId,
      task_id: taskId,
      urgent: willBeUrgent
    });
    fetchBoard(); // unconditional cross-store sync — see completeTask comment
  } catch (e) {
    if (myGen !== generation) return;
    backlogStore.set({
      ...backlogStore.get(),
      tasks: snapshot,
      ...deriveCounts(snapshot),
      error: String(e?.message || e)
    });
  }
}

export async function reorder(newOrderIds) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const snapshot = before.tasks;

  // Defensive: validate newOrderIds is an array containing exactly the
  // same set of ids as snapshot.tasks. Codex 5b-3 Phase 3 flagged that
  // a malformed drag-layer payload (e.g. partial list, duplicate ids,
  // or extra ids) would silently produce an unexpected reorder both
  // optimistically AND on the backend. Reject malformed payloads here.
  if (!Array.isArray(newOrderIds)) return;
  if (newOrderIds.length !== snapshot.length) return;
  const snapshotIds = new Set(snapshot.map(t => t.id));
  const orderIdSet = new Set(newOrderIds);
  if (orderIdSet.size !== newOrderIds.length) return; // duplicate ids
  for (const id of newOrderIds) {
    if (!snapshotIds.has(id)) return; // unknown id
  }

  // Build new ordered array by id lookup. The defensive checks above
  // mean every id is present and accounted for — no append-leftovers
  // path needed (kept the loop pattern from api/backlog.js op:reorder
  // for consistency).
  const byId = new Map(snapshot.map(t => [t.id, t]));
  const reordered = [];
  for (const id of newOrderIds) {
    if (byId.has(id)) {
      reordered.push(byId.get(id));
      byId.delete(id);
    }
  }
  for (const t of snapshot) {
    if (byId.has(t.id)) reordered.push(t);
  }

  // Apply assignBucketedPriorities optimistically — backend does the
  // same on op:reorder. Without this, subsequent urgent-toggles trigger
  // sortUrgentFirst() on stale priority values and visually "snap"
  // dragged tasks back toward their old positions.
  const withPriorities = assignBucketedPriorities(reordered);

  // Counts unchanged by reorder; skip recompute.
  backlogStore.set({
    ...before,
    tasks: withPriorities,
    error: null
  });

  try {
    await backlogOp({ op: 'reorder', project_id: projectId, order: newOrderIds });
    fetchBoard(); // unconditional cross-store sync — see completeTask comment
  } catch (e) {
    if (myGen !== generation) return;
    backlogStore.set({
      ...backlogStore.get(),
      tasks: snapshot,
      error: String(e?.message || e)
    });
  }
}

export async function editText(taskId, newText) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const snapshot = before.tasks;

  // Frontend defense in depth: trim + slice mirrors backend
  // op:update_task_text validation (api/backlog.js). Backend
  // re-validates regardless; pre-normalizing here keeps optimistic
  // state matching what the server will store.
  const cleanText = String(newText || '').trim().slice(0, 200);
  if (cleanText.length === 0) return; // bail silently — caller should guard

  const optimistic = snapshot.map(t =>
    t.id === taskId ? { ...t, text: cleanText } : t
  );
  // Counts unchanged by text edit; skip recompute.
  backlogStore.set({
    ...before,
    tasks: optimistic,
    error: null
  });

  try {
    await backlogOp({
      op: 'update_task_text',
      project_id: projectId,
      task_id: taskId,
      text: cleanText
    });
    fetchBoard(); // unconditional cross-store sync — see completeTask comment
  } catch (e) {
    if (myGen !== generation) return;
    backlogStore.set({
      ...backlogStore.get(),
      tasks: snapshot,
      error: String(e?.message || e)
    });
  }
}

export async function deleteTask(taskId) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const snapshot = before.tasks;

  const optimistic = snapshot.filter(t => t.id !== taskId);
  const { taskCount, urgentCount } = deriveCounts(optimistic);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    taskCount,
    urgentCount,
    error: null
  });

  try {
    await backlogOp({ op: 'delete_task', project_id: projectId, task_id: taskId });
    fetchBoard(); // unconditional cross-store sync — see completeTask comment
  } catch (e) {
    if (myGen !== generation) return;
    backlogStore.set({
      ...backlogStore.get(),
      tasks: snapshot,
      ...deriveCounts(snapshot),
      error: String(e?.message || e)
    });
  }
}

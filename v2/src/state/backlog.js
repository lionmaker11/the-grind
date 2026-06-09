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
//   (5) on error AND if generation still matches: apply the INVERSE
//       patch to CURRENT store state (see patch-based rollback below),
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
// Patch-based rollback (5b-10; closes the concurrent-mutator class
// elevated 3x across 5b-3/5b-5/5b-6):
//   Whole-array snapshot restore could resurrect/undo OTHER mutations
//   that succeeded between a mutator's start and its failure (e.g.
//   completeTask(A) succeeds, then a previously-started toggleUrgent(B)
//   fails and restores the pre-complete array, resurrecting A). Each
//   mutator now reverses ONLY its own change against CURRENT state:
//   - completeTask/deleteTask failure: re-insert the removed task at
//     its sorted position in the CURRENT array
//   - toggleUrgent failure: restore the captured original urgent flag
//     by id (no-op if the task has since been removed)
//   - editText failure: restore the captured original text by id
//     (no-op if removed)
//   - reorder failure: restore the captured original relative order +
//     priorities for tasks still present; tasks added/removed since
//     keep their current membership
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
    // message rather than dismissing without explanation. Set
    // projectName to projectId as a fallback so the modal header
    // shows context ("Project not found: foo-bar") rather than the
    // bare "..." placeholder. Codex 5b-8 Phase 3 flagged this UX gap.
    backlogStore.setKey('loading', false);
    backlogStore.setKey('error', String(e?.message || e));
    backlogStore.setKey('projectName', projectId);
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

// Apply an inverse patch to the CURRENT store state and recompute
// counts. All rollback paths funnel through here so the "read current,
// patch, derive, set error" shape stays consistent.
function rollbackWith(patchFn, errorMessage) {
  const current = backlogStore.get();
  const patchedTasks = patchFn(current.tasks);
  backlogStore.set({
    ...current,
    tasks: patchedTasks,
    ...deriveCounts(patchedTasks),
    error: errorMessage
  });
}

export async function completeTask(taskId) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;

  // Recurring daily tasks stay pending in vault per api/backlog.js
  // op:complete. Backend stamps last_completed without flipping
  // status. Optimistic filter MUST NOT remove recurring tasks or
  // they'll vanish from the modal until next fetch — Codex 5b-5
  // Phase 3 flagged as user-visible bug (real recurring task exists
  // at vault/projects/fitness/fit-001).
  const removedTask = before.tasks.find(t => t.id === taskId);
  if (!removedTask) return; // stale tap on an already-removed row
  const isRecurring = removedTask.recurring === 'daily';
  const optimistic = isRecurring
    ? before.tasks // recurring task stays visible; backend stamps last_completed
    : before.tasks.filter(t => t.id !== taskId);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    ...deriveCounts(optimistic),
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
    // Inverse patch: re-insert the removed task at its sorted position
    // in the CURRENT array (recurring case removed nothing → no-op
    // guard via includes check). Mutations that landed since are kept.
    // Accepted residual: if an edit/toggle on THIS task was in flight
    // when it was optimistically removed and succeeded on the backend,
    // the re-inserted object carries pre-edit fields — display-stale
    // until next openProject; backend state is correct.
    rollbackWith(
      (tasks) => {
        if (isRecurring) return tasks; // nothing was removed
        if (tasks.some(t => t.id === taskId)) return tasks; // already back
        return sortUrgentFirst([...tasks, removedTask]);
      },
      String(e?.message || e)
    );
  }
}

export async function toggleUrgent(taskId, urgent) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;
  const willBeUrgent = Boolean(urgent);

  // Capture the original flag for inverse patch (not just !willBeUrgent:
  // a redundant set-to-same-value call should roll back to the true
  // original, which equals current in that case anyway).
  const targetTask = before.tasks.find(t => t.id === taskId);
  if (!targetTask) return; // stale tap
  const originalUrgent = Boolean(targetTask.urgent);

  const patched = before.tasks.map(t =>
    t.id === taskId ? { ...t, urgent: willBeUrgent } : t
  );
  const optimistic = sortUrgentFirst(patched);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    ...deriveCounts(optimistic),
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
    // Inverse patch: restore the original urgent flag by id —
    // CONDITIONAL on the task still carrying MY optimistic value. If a
    // later toggle on the same task succeeded in between, its value
    // wins and this rollback is a no-op (Codex 5b-10: unconditional
    // restore clobbered later same-entity successes). Removed-since
    // tasks are a map no-op — nothing resurrects.
    rollbackWith(
      (tasks) => sortUrgentFirst(
        tasks.map(t =>
          t.id === taskId && Boolean(t.urgent) === willBeUrgent
            ? { ...t, urgent: originalUrgent }
            : t
        )
      ),
      String(e?.message || e)
    );
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

  // Capture original order + priorities for the inverse patch.
  const originalOrderIds = snapshot.map(t => t.id);
  const originalPriorityById = new Map(snapshot.map(t => [t.id, t.priority]));

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
    // Inverse patch — CONDITIONAL: only restore the original order if
    // the CURRENT order still matches MY optimistic order (for the ids
    // we both know about). If a later reorder succeeded in between,
    // its order wins and this rollback is a no-op (Codex 5b-10:
    // unconditional restore clobbered later same-entity successes).
    const myOptimisticIds = withPriorities.map(t => t.id);
    rollbackWith(
      (tasks) => {
        const currentIds = tasks.map(t => t.id);
        const currentSharedOrder = currentIds.filter(id => originalPriorityById.has(id));
        const mySharedOrder = myOptimisticIds.filter(id => currentIds.includes(id));
        const stillMine =
          currentSharedOrder.length === mySharedOrder.length &&
          currentSharedOrder.every((id, i) => id === mySharedOrder[i]);
        if (!stillMine) return tasks; // a later reorder landed — keep it

        // Restore ORIGINAL relative order + priorities for tasks still
        // present. Removed-since stay removed; added-since append.
        const currentById = new Map(tasks.map(t => [t.id, t]));
        const restored = [];
        for (const id of originalOrderIds) {
          const t = currentById.get(id);
          if (!t) continue;
          const origPriority = originalPriorityById.get(id);
          restored.push(
            origPriority === undefined ? t : { ...t, priority: origPriority }
          );
          currentById.delete(id);
        }
        for (const t of tasks) {
          if (currentById.has(t.id)) restored.push(t);
        }
        return restored;
      },
      String(e?.message || e)
    );
  }
}

// Returns Promise<{ ok: true } | { ok: false, error: string }>.
// Phase 5b-6 needs the outcome to render row-level save-failure state
// per Daily-driver-tool hard requirement (reviewer-context.md). Other
// mutators (complete, toggleUrgent, delete, reorder) currently return
// void — consistency upgrade is deferred to a future refactor.
export async function editText(taskId, newText) {
  const before = backlogStore.get();
  if (!before.openProjectId) return { ok: false, error: 'No project open' };
  const projectId = before.openProjectId;
  const myGen = generation;

  // Frontend defense in depth: trim + slice mirrors backend
  // op:update_task_text validation (api/backlog.js). Backend
  // re-validates regardless; pre-normalizing here keeps optimistic
  // state matching what the server will store.
  const cleanText = String(newText || '').trim().slice(0, 200);
  if (cleanText.length === 0) return { ok: false, error: 'Empty text' };

  // Capture original text for inverse patch.
  const targetTask = before.tasks.find(t => t.id === taskId);
  if (!targetTask) return { ok: false, error: 'Task not found' };
  const originalText = targetTask.text;

  const optimistic = before.tasks.map(t =>
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
    return { ok: true };
  } catch (e) {
    const errorMessage = String(e?.message || e);
    if (myGen !== generation) return { ok: false, error: errorMessage };
    // Inverse patch: restore the original text by id — CONDITIONAL on
    // the task still carrying MY optimistic text. If a later edit on
    // the same task succeeded in between, its text wins (Codex 5b-10:
    // unconditional restore clobbered later same-entity successes).
    // No-op if the task was removed since.
    rollbackWith(
      (tasks) => tasks.map(t =>
        t.id === taskId && t.text === cleanText
          ? { ...t, text: originalText }
          : t
      ),
      errorMessage
    );
    return { ok: false, error: errorMessage };
  }
}

export async function deleteTask(taskId) {
  const before = backlogStore.get();
  if (!before.openProjectId) return;
  const projectId = before.openProjectId;
  const myGen = generation;

  const removedTask = before.tasks.find(t => t.id === taskId);
  if (!removedTask) return; // stale tap on an already-removed row

  const optimistic = before.tasks.filter(t => t.id !== taskId);
  backlogStore.set({
    ...before,
    tasks: optimistic,
    ...deriveCounts(optimistic),
    error: null
  });

  try {
    await backlogOp({ op: 'delete_task', project_id: projectId, task_id: taskId });
    fetchBoard(); // unconditional cross-store sync — see completeTask comment
  } catch (e) {
    if (myGen !== generation) return;
    // Inverse patch: re-insert the removed task at its sorted position
    // in the CURRENT array. Concurrent mutations that landed since are
    // preserved.
    rollbackWith(
      (tasks) => {
        if (tasks.some(t => t.id === taskId)) return tasks; // already back
        return sortUrgentFirst([...tasks, removedTask]);
      },
      String(e?.message || e)
    );
  }
}

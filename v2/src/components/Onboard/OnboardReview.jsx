// OnboardReview — R5b-5 structure + render (non-interactive).
//
// Renders the full review surface per design/mockups/40-onboard-review.html
// plus the collapsed-default + orphan-assignment revisions settled in R5b-5
// reading. Every interactive affordance is rendered in markup but handlers
// are stubbed; R5b-6 wires them.
//
// ─── Spec deviations from the mockup (resolved pre-implementation) ────────
// 1. CONFLICT 1 — spec supersedes mockup: project cards render COLLAPSED by
//    default (head + match-row only). Expand chevron on the right side of
//    the head, project-level drag handle on the left, project-delete (×)
//    after the chevron. Neither chevron nor project-drag exists in the
//    mockup; both are invented here consistent with the mockup's visual
//    language and called out below with `// not in mockup` comments.
// 2. CONFLICT 2 — orphan picker is an ASSIGN → BUTTON that opens the
//    OrphanPicker bottom-sheet (R5b-4), NOT the mockup's native <select>.
//    Rows render in three visual states: unassigned (ASSIGN → button),
//    assigned (inline pill + UNDO), discarded (strikethrough + UNDO).
//
// ─── State model (non-interactive R5b-5) ──────────────────────────────────
// expandedTempIds: Set of project tempIds currently expanded. Local
// useState. Collapsed-by-default. R5b-6 will wire chevron onClick to
// toggle. In R5b-5 the chevron renders but its onClick is stubbed.
//
// ─── Done-state teardown ──────────────────────────────────────────────────
// Preserved from R5a: a useEffect watches step === 'done' and calls
// closeOnboard(true) ~1s later. Onboard.jsx also routes step='done' to
// null body, so in practice the effect may never fire before this
// component unmounts. Not fixing in R5b-5 — pre-existing issue, revisit
// when commit orchestrator wiring lands in R5b-6 or later.
//
// ─── R5b-6 wiring status ──────────────────────────────────────────────────
// - project expand chevron (R5b-6a ✓)
// - project drag handle (createListDragController + reorderProjects) (R5b-6b₁ ✓)
// - project × — orphan-conversion per open #17 option (c) (R5b-6b₂ ✓)
// - project-name inline edit (editProjectName) (R5b-6b₂ ✓)
// - match-row toggle (setMatchDecision) (R5b-6a ✓)
// - task drag handle (reorderTasks) (R5b-6b₁ ✓)
// - task text inline edit (editTaskText) (R5b-6b₂ ✓)
// - task edit ✎ — opens inline editor on .task-text (R5b-6b₂ ✓)
// - task urgent long-press (toggleTaskUrgent) (R5b-6b₂ ✓)
// - task delete × (deleteTask) (R5b-6a ✓)
// - + ADD TASK (addTask) (R5b-6a ✓)
// - + ADD PROJECT (addProject) (R5b-6a ✓)
// - orphan ASSIGN → (opens OrphanPicker) (R5b-6b₂ ✓)
// - orphan assigned × — re-opens OrphanPicker (R5b-6b₂ ✓)
// - orphan discarded ↺ — unassignOrphan back to pending (R5b-6b₂ ✓)
// - LOCK IT IN (startCommit + commitOnboardingResults) — R5b-6c ✓
//
// Out of scope for R5b-6b₂: project-level urgent toggle (no spec
// gesture defined — urgent-count pill is display-only).

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  onboardStore,
  closeOnboard,
  clearError,
  isReadyToCommit,
  setMatchDecision,
  deleteTask,
  addTask,
  addProject,
  deleteProject,
  reorderProjects,
  reorderTasks,
  editProjectName,
  editTaskText,
  toggleTaskUrgent,
  unassignOrphan,
  startCommit,
  commitOnboardingResults,
} from '../../state/onboard.js';
import { boardStore } from '../../state/board.js';
import { createListDragController } from '../../lib/drag.js';
import { createLongPress } from '../../lib/longpress.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OrphanPicker } from './OrphanPicker.jsx';
import './OnboardReview.css';

function urgentCountFor(project) {
  const tasks = project.tasks || [];
  return tasks.reduce((acc, t) => acc + (t.urgent ? 1 : 0), 0);
}

function matchedNameFrom(summary, existingId) {
  const row = (summary || []).find(p => p.project_id === existingId);
  return row?.project_name || existingId;
}

function existingNameFrom(summary, existingId) {
  const row = (summary || []).find(p => p.project_id === existingId);
  return row?.project_name || existingId;
}

function extractedNameFrom(projects, tempId) {
  const p = (projects || []).find(x => x.tempId === tempId);
  return p?.name || '(unnamed)';
}

export function OnboardReview() {
  const { step, extracted, commitProgress, matches, orphanAssignments, error } = useStore(onboardStore);
  const { summary } = useStore(boardStore);

  const [expandedTempIds, setExpandedTempIds] = useState(() => new Set());
  const [pickerOpenForOrphan, setPickerOpenForOrphan] = useState(null);
  const [editingProjectTempId, setEditingProjectTempId] = useState(null);

  const projects = extracted?.projects || [];
  const orphans = extracted?.orphanTasks || [];
  const { total, completed, failed } = commitProgress;
  const inProgress = step === 'committing';
  const isDone = step === 'done';
  const isError = step === 'error';

  // Done-state teardown — preserved from R5a. See header note.
  useEffect(() => {
    if (!isDone) return;
    const id = setTimeout(() => closeOnboard(true), 1000);
    return () => clearTimeout(id);
  }, [isDone]);

  // Project-list drag controller — stable across renders, destroyed on unmount.
  // One controller for the project list; per-project task controllers live in
  // ExpandedProjectBody so they unmount with their project body.
  const projectDrag = useMemo(
    () => createListDragController({
      onReorder: (from, to) => reorderProjects(from, to),
    }),
    []
  );
  useEffect(() => () => projectDrag.destroy(), [projectDrag]);

  const lockDisabled = inProgress || isDone || !isReadyToCommit();

  function isExpanded(tempId) {
    return expandedTempIds.has(tempId);
  }

  function toggleExpand(tempId) {
    setExpandedTempIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  }

  return (
    <>
      <OnboardFooter step={step} />
      <div class="or-viewport" data-testid="onboard-review">
        <div class="review-eyebrow">
          ➤ // HERE'S WHAT I FILED. FIX ANYTHING.
          <span class="line2">// DRAG TO REORDER. LONG-PRESS TO MARK URGENT.</span>
          <span class="line2 or-eyebrow-sub">// CHECK THE PROJECTS FIRST. TAP TO OPEN.</span>
        </div>

        {projects.length === 0 && (
          <div class="or-empty" data-testid="onboard-review-empty">
            // NO PROJECTS EXTRACTED
          </div>
        )}

        {projects.map((p, pIdx) => {
          const expanded = isExpanded(p.tempId);
          const nUrgent = urgentCountFor(p);
          const nTotal = (p.tasks || []).length;
          const decision = matches?.[p.tempId]; // { merge: boolean } | undefined
          const hasMatch = Boolean(p.matched_existing_id);
          const matchName = hasMatch ? matchedNameFrom(summary, p.matched_existing_id) : null;

          let matchLineText;
          let matchToggleLabel;
          if (!decision) {
            matchLineText = 'DECIDE: MERGE OR CREATE';
            matchToggleLabel = 'CREATE NEW';
          } else if (decision.merge) {
            matchLineText = `MERGING INTO ${matchName}`;
            matchToggleLabel = 'CREATE NEW';
          } else {
            matchLineText = 'CREATING AS NEW';
            matchToggleLabel = 'MERGE WITH EXISTING';
          }

          return (
            <div
              key={p.tempId}
              {...projectDrag.itemProps(pIdx)}
              class="panel project-card or-project"
              data-testid={`onboard-project-${p.tempId}`}
            >
              <span class="corner tl"></span><span class="corner tr"></span>
              <span class="corner bl"></span><span class="corner br"></span>

              <div class="project-head">
                {/* not in mockup — project-level drag handle */}
                <span
                  {...projectDrag.handleProps(pIdx)}
                  class="drag-handle or-project-drag"
                  aria-label="Drag project to reorder"
                  data-testid={`onboard-project-drag-${p.tempId}`}
                />
                {editingProjectTempId === p.tempId ? (
                  <ProjectNameEditor
                    pIdx={pIdx}
                    projectTempId={p.tempId}
                    initialValue={p.name || ''}
                    onDone={() => setEditingProjectTempId(null)}
                  />
                ) : (
                  <span
                    class="project-name or-project-name-static"
                    onClick={() => setEditingProjectTempId(p.tempId)}
                    data-testid={`onboard-project-name-${p.tempId}`}
                  >
                    {p.name || '(unnamed)'}
                  </span>
                )}
                {nTotal > 0 && (
                  <span
                    class={`urgent-count${nUrgent === 0 ? ' urgent-count--zero' : ''}`}
                    data-testid={`onboard-project-urgent-count-${p.tempId}`}
                  >
                    <span class="n-urgent">{nUrgent} URGENT</span>
                    <span class="slash">/</span>
                    {nTotal}
                  </span>
                )}
                {/* not in mockup — expand chevron */}
                <button
                  type="button"
                  class="or-expand-chevron"
                  aria-expanded={expanded}
                  aria-controls={`onboard-project-body-${p.tempId}`}
                  aria-label={expanded ? 'Collapse project' : 'Expand project'}
                  onClick={() => toggleExpand(p.tempId)}
                  data-testid={`onboard-project-expand-${p.tempId}`}
                >
                  {expanded ? '▾' : '▸'}
                </button>
                {/* not in mockup — project delete (see open-item #17) */}
                <button
                  type="button"
                  class="btn-icon delete or-project-delete"
                  aria-label="Delete project"
                  onClick={() => {
                    deleteProject(pIdx);
                    setExpandedTempIds((prev) => {
                      const next = new Set(prev);
                      next.delete(p.tempId);
                      return next;
                    });
                  }}
                  data-testid={`onboard-project-delete-${p.tempId}`}
                >
                  ×
                </button>
              </div>

              {hasMatch && (
                <div class="match-row">
                  <span class="match-badge">● MATCH</span>
                  <span class="match-line-text">
                    <span class="arrow">→</span> {matchLineText}
                  </span>
                  <button
                    type="button"
                    class="toggle"
                    onClick={() => setMatchDecision(p.tempId, !(decision?.merge === true))}
                    data-testid={`onboard-match-toggle-${p.tempId}`}
                  >
                    {matchToggleLabel}
                  </button>
                </div>
              )}

              {expanded && (
                <ExpandedProjectBody
                  pIdx={pIdx}
                  projectTempId={p.tempId}
                  tasks={p.tasks || []}
                />
              )}
            </div>
          );
        })}

        <button
          type="button"
          class="add-project-ghost"
          onClick={() => addProject()}
          data-testid="onboard-add-project"
        >
          + ADD PROJECT
        </button>

        {orphans.length > 0 && (
          <div class="orphan-panel" data-testid="onboard-orphan-panel">
            <div class="orphan-head">◇ // COULDN'T PLACE THESE</div>
            <div class="orphan-sub">Assign a project or delete.</div>

            {orphans.map((o) => {
              const a = orphanAssignments?.[o.tempId];
              const assigned = a && a.kind && a.kind !== 'deleted';
              const discarded = a?.kind === 'deleted';

              let pillText = null;
              if (a?.kind === 'existing') {
                pillText = `→ ${existingNameFrom(summary, a.existingId)}`;
              } else if (a?.kind === 'new-extracted') {
                pillText = `→ NEW: ${extractedNameFrom(projects, a.projectTempId)}`;
              } else if (a?.kind === 'new-adhoc') {
                pillText = `→ NEW: ${a.newName}`;
              }

              const rowClass =
                'orphan-row' +
                (assigned ? ' orphan-row--assigned' : '') +
                (discarded ? ' orphan-row--discarded' : '');

              return (
                <div
                  key={o.tempId}
                  class={rowClass}
                  data-testid={`onboard-orphan-row-${o.tempId}`}
                >
                  <span class="orphan-glyph" aria-hidden="true">◇</span>
                  <div class="orphan-text">{o.text}</div>
                  {!assigned && !discarded && (
                    <button
                      type="button"
                      class="or-orphan-assign"
                      onClick={() => setPickerOpenForOrphan(o.tempId)}
                      data-testid={`onboard-orphan-assign-${o.tempId}`}
                    >
                      ASSIGN →
                    </button>
                  )}
                  {assigned && (
                    <>
                      <span class="or-orphan-pill" data-testid={`onboard-orphan-pill-${o.tempId}`}>
                        {pillText}
                      </span>
                      <button
                        type="button"
                        class="or-orphan-undo"
                        aria-label="Change assignment"
                        onClick={() => setPickerOpenForOrphan(o.tempId)}
                        data-testid={`onboard-orphan-undo-${o.tempId}`}
                      >
                        ×
                      </button>
                    </>
                  )}
                  {discarded && (
                    <>
                      <span class="or-orphan-pill or-orphan-pill--discarded">× DISCARDED</span>
                      <button
                        type="button"
                        class="or-orphan-undo"
                        aria-label="Undo discard"
                        onClick={() => unassignOrphan(o.tempId)}
                        data-testid={`onboard-orphan-undo-${o.tempId}`}
                      >
                        ↺
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isError && (
          <div class="or-error-banner" role="alert" data-testid="onboard-review-error">
            // ERROR: {error?.message || 'commit failed'}
            <button
              type="button"
              onClick={clearError}
              data-testid="onboard-review-error-retry"
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      <div class="lock-dock slim">
        <button
          type="button"
          class="review-lock"
          disabled={lockDisabled}
          onClick={() => {
            startCommit();
            commitOnboardingResults();
          }}
          data-testid="onboard-lock-in"
        >
          {inProgress ? (
            <span aria-live="polite" data-testid="onboard-commit-progress">
              LOCKING IN · {completed} / {total}
              {failed.length > 0 && <> · {failed.length} FAILED</>}
            </span>
          ) : isDone ? (
            <span data-testid="onboard-commit-done">DONE · CLOSING…</span>
          ) : (
            <>LOCK IT IN ▶</>
          )}
        </button>
      </div>

      {pickerOpenForOrphan && (
        <OrphanPicker
          orphanTempId={pickerOpenForOrphan}
          onClose={() => setPickerOpenForOrphan(null)}
        />
      )}
    </>
  );
}

// Per-project task list. Owns its own drag controller so each expanded
// project gets an independent reorder context. The controller is keyed
// to pIdx — if the parent project moves (project-list reorder) or a
// sibling project is deleted, pIdx may shift and the controller is
// rebuilt against the new index. Cheap per drag.js docstring §4.
function ExpandedProjectBody({ pIdx, projectTempId, tasks }) {
  const [editingTaskTempId, setEditingTaskTempId] = useState(null);

  const taskDrag = useMemo(
    () => createListDragController({
      onReorder: (from, to) => reorderTasks(pIdx, from, to),
    }),
    [pIdx]
  );
  useEffect(() => () => taskDrag.destroy(), [taskDrag]);

  return (
    <div id={`onboard-project-body-${projectTempId}`} class="or-project-body">
      {tasks.map((t, tIdx) => (
        <TaskRow
          key={t.tempId}
          pIdx={pIdx}
          tIdx={tIdx}
          task={t}
          isEditing={editingTaskTempId === t.tempId}
          onStartEdit={() => setEditingTaskTempId(t.tempId)}
          onStopEdit={() => setEditingTaskTempId(null)}
          taskDrag={taskDrag}
        />
      ))}
      <button
        type="button"
        class="add-task-ghost"
        onClick={() => addTask(pIdx)}
        data-testid={`onboard-add-task-${projectTempId}`}
      >
        + ADD TASK
      </button>
    </div>
  );
}

// Per-task row. Owns its own long-press controller (one per task,
// keyed to [pIdx, tIdx] so reorders/inserts rebuild against the
// current indices). Long-press target is .task-text only — drag
// pointer events live on the drag-handle child, so no conflict.
//
// Edit-trigger discipline: the ✎ button is the ONLY way into
// edit mode. .task-text intentionally has NO onClick. Reason:
// after a successful long-press, the browser still synthesizes
// a native click event from the same pointerdown+pointerup pair,
// so an onClick on .task-text would race with toggleTaskUrgent
// and drop the user into edit mode immediately after marking
// urgent. Routing edit through the ✎ button (a separate element
// from the long-press target) eliminates the race. Mirrors the
// × delete-button pattern.
//
// Long-press onTap is intentionally left undefined: per
// longpress.js line 82 (`if (fireTap && !fired && !moved &&
// onTap) onTap()`), undefined onTap is a silent no-op. Combined
// with the no-onClick rule above, .task-text dispatches nothing
// on a quick tap — it's a display-only element except for the
// long-press hold gesture.
function TaskRow({ pIdx, tIdx, task, isEditing, onStartEdit, onStopEdit, taskDrag }) {
  const longpress = useMemo(
    () => createLongPress({
      onLongPress: () => toggleTaskUrgent(pIdx, tIdx),
    }),
    [pIdx, tIdx]
  );

  return (
    <div
      {...taskDrag.itemProps(tIdx)}
      class={`task-row${task.urgent ? ' urgent' : ''}`}
      data-testid={`onboard-task-${task.tempId}`}
    >
      <span
        {...taskDrag.handleProps(tIdx)}
        class="drag-handle"
        aria-label="Drag task to reorder"
        data-testid={`onboard-task-drag-${task.tempId}`}
      />
      {isEditing ? (
        <TaskTextEditor
          pIdx={pIdx}
          tIdx={tIdx}
          taskTempId={task.tempId}
          initialValue={task.text || ''}
          onDone={onStopEdit}
        />
      ) : (
        <div
          class="task-text"
          {...longpress.props()}
          data-testid={`onboard-task-text-${task.tempId}`}
        >
          {task.text}
        </div>
      )}
      <div class="task-actions">
        <button
          type="button"
          class="btn-icon edit"
          aria-label="Edit task"
          onClick={onStartEdit}
          data-testid={`onboard-task-edit-${task.tempId}`}
        >
          ✎
        </button>
        <button
          type="button"
          class="btn-icon delete"
          aria-label="Delete task"
          onClick={() => deleteTask(pIdx, tIdx)}
          data-testid={`onboard-task-delete-${task.tempId}`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Inline project-name editor. Mounted in place of the static
// .project-name span when editingProjectTempId === p.tempId.
//
// Edit semantics:
//   - Mount: focus + select-all so quick re-typing replaces the
//     existing name without manual highlight.
//   - Enter: blur the input, which triggers commit via onBlur.
//   - Escape: set cancelledRef, then blur — onBlur sees the flag
//     and skips commit, preserving the prior value.
//   - Blur (Enter, tab-away, click-elsewhere): if trimmed value
//     is non-empty, commit via editProjectName. If trimmed-empty,
//     revert silently (close the editor, leave the prior name in
//     place). Does NOT delete the project — the × button is the
//     only deletion path. isReadyToCommit() already blocks LOCK
//     IT IN on empty project names, so a reverted empty can't
//     escape review unnoticed.
//   - onClick stopPropagation on the input prevents the parent
//     span's onClick (which re-enters edit mode) from re-firing
//     and stealing focus mid-typing.
function ProjectNameEditor({ pIdx, projectTempId, initialValue, onDone }) {
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleBlur() {
    if (cancelledRef.current) {
      onDone();
      return;
    }
    const trimmed = (inputRef.current?.value || '').trim();
    if (!trimmed) {
      onDone();
      return;
    }
    editProjectName(pIdx, trimmed);
    onDone();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      inputRef.current?.blur();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      class="or-project-name-input"
      defaultValue={initialValue}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      data-testid={`onboard-project-name-input-${projectTempId}`}
    />
  );
}

// Inline task-text editor. Same shape as ProjectNameEditor —
// see that header for the Enter/Escape/blur semantics. Trimmed-
// empty on blur reverts to the prior value (close editor, keep
// prior text). Does NOT delete the task — the × button is the
// only deletion path. Avoids surprising hostile delete on an
// accidental clear; LOCK IT IN's commit pass also drops empty-
// text tasks defensively (commitOnboardingResults Pass 3).
function TaskTextEditor({ pIdx, tIdx, taskTempId, initialValue, onDone }) {
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleBlur() {
    if (cancelledRef.current) {
      onDone();
      return;
    }
    const trimmed = (inputRef.current?.value || '').trim();
    if (!trimmed) {
      onDone();
      return;
    }
    editTaskText(pIdx, tIdx, trimmed);
    onDone();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      inputRef.current?.blur();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      class="or-task-text-input"
      defaultValue={initialValue}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      data-testid={`onboard-task-text-input-${taskTempId}`}
    />
  );
}

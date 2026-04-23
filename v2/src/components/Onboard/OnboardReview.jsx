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
// ─── R5b-6 open wiring ────────────────────────────────────────────────────
// - project expand chevron (R5b-6a ✓)
// - project drag handle (createListDragController + reorderProjects) — R5b-6b
// - project × (R5b-6a ✓ — calls existing deleteProject; orphan-conversion per open #17 is R5b-6b)
// - project-name inline edit — R5b-6b
// - urgent-count long-press — R5b-6b
// - match-row toggle (setMatchDecision) (R5b-6a ✓)
// - task drag handle (reorderTasks) — R5b-6b
// - task text inline edit (editTaskText) — R5b-6b
// - task edit ✎ (focus contentEditable) — R5b-6b
// - task delete × (deleteTask) (R5b-6a ✓)
// - + ADD TASK (addTask) (R5b-6a ✓)
// - + ADD PROJECT (addProject) (R5b-6a ✓)
// - orphan ASSIGN → (opens OrphanPicker) — R5b-6b
// - orphan UNDO (assignOrphan undefined? or re-open picker) — R5b-6b
// - LOCK IT IN (startCommit + commitOnboardingResults) — R5b-6c (depends on order:'append' wiring)

import { useEffect, useState } from 'preact/hooks';
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
} from '../../state/onboard.js';
import { boardStore } from '../../state/board.js';
import { OnboardFooter } from './OnboardFooter.jsx';
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
              class="panel project-card or-project"
              data-testid={`onboard-project-${p.tempId}`}
            >
              <span class="corner tl"></span><span class="corner tr"></span>
              <span class="corner bl"></span><span class="corner br"></span>

              <div class="project-head">
                {/* not in mockup — project-level drag handle */}
                <span
                  class="drag-handle or-project-drag"
                  aria-label="Drag project to reorder"
                  data-testid={`onboard-project-drag-${p.tempId}`}
                />
                <span class="project-name or-project-name-static">
                  {p.name || '(unnamed)'}
                </span>
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
                <div id={`onboard-project-body-${p.tempId}`} class="or-project-body">
                  {(p.tasks || []).map((t, tIdx) => (
                    <div
                      key={t.tempId}
                      class={`task-row${t.urgent ? ' urgent' : ''}`}
                      data-testid={`onboard-task-${t.tempId}`}
                    >
                      <span
                        class="drag-handle"
                        aria-label="Drag task to reorder"
                        data-testid={`onboard-task-drag-${t.tempId}`}
                      />
                      <div class="task-text">{t.text}</div>
                      <div class="task-actions">
                        <button
                          type="button"
                          class="btn-icon edit"
                          aria-label="Edit task"
                          onClick={() => { /* R5b-6b — focus contentEditable */ }}
                          data-testid={`onboard-task-edit-${t.tempId}`}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          class="btn-icon delete"
                          aria-label="Delete task"
                          onClick={() => deleteTask(pIdx, tIdx)}
                          data-testid={`onboard-task-delete-${t.tempId}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    class="add-task-ghost"
                    onClick={() => addTask(pIdx)}
                    data-testid={`onboard-add-task-${p.tempId}`}
                  >
                    + ADD TASK
                  </button>
                </div>
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
                      onClick={() => { /* R5b-6b — open OrphanPicker */ }}
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
                        onClick={() => { /* R5b-6b */ }}
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
                        onClick={() => { /* R5b-6b */ }}
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
          onClick={() => { /* R5b-6c — startCommit + commitOnboardingResults */ }}
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
    </>
  );
}

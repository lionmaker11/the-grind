// Onboarding state store. Phase 4 redesign — one capture + optional clarify
// → Opus extraction → review (with match merges + orphan assignment) →
// LOCK IT IN commit. See /vault/build/phase4-redesign-spec.md.
//
// Pure state. No fetch, no voice.js — components drive those side effects
// and dispatch back into this store. Invalid transitions are no-ops so
// mis-ordered dispatches can't crash the surface.

import { map } from 'nanostores';
import { projectOp, backlogOp } from '../lib/api.js';

// ─── Constants ────────────────────────────────────────────────────────

// 9 flow + 2 meta = 11 step values. Flow: intro → capture-ask →
// capture-record → clarify-ask → clarify-record → parsing → review →
// committing → done. Meta: idle (inactive resting state, isActive:false)
// and error (orthogonal off-ramp entered via setError from any flow step).
export const STEPS = Object.freeze([
  'idle',
  'intro',
  'capture-ask',
  'capture-record',
  'clarify-ask',
  'clarify-record',
  'parsing',
  'review',
  'committing',
  'done',
  'error'
]);

// Match-confidence thresholds for default MERGE vs CREATE NEW decisions.
// ≥ HIGH auto-merges; < LOW auto-create-new; between forces user choice.
const MATCH_CONFIDENCE_HIGH = 0.7;
const MATCH_CONFIDENCE_LOW = 0.3;

const INITIAL_STATE = {
  step: 'idle',
  isActive: false,

  // Shared mic scratch (reused by capture + clarify phases)
  isRecording: false,
  isTranscribing: false,
  transcriptLive: '',
  transcriptPending: '',

  // Captured transcripts
  capture: null,
  clarify: null,

  // Extraction
  isExtracting: false,
  extracted: null,

  // Review decisions
  matches: {},
  orphanAssignments: {},

  // Commit lifecycle
  committing: false,
  commitProgress: { total: 0, completed: 0, failed: [] },

  // UX meta
  error: null,
  exitConfirmOpen: false
};

// Invalid edges are silent no-ops. `* → idle` is always allowed via
// closeOnboard(force) / confirmExit() — not enumerated here. `error` is
// entered from any flow step via setError(); its back-edges are handled by
// ERROR_RECOVERY_STEP below.
const VALID_EDGES = {
  idle: ['intro'],
  intro: ['capture-ask', 'idle'],
  'capture-ask': ['capture-record', 'intro', 'idle'],
  'capture-record': ['parsing', 'capture-ask', 'idle'],
  'clarify-ask': ['clarify-record', 'review', 'idle'],
  'clarify-record': ['parsing', 'clarify-ask', 'idle'],
  parsing: ['clarify-ask', 'review', 'idle'],
  review: ['committing', 'idle'],
  committing: ['done', 'idle'],
  done: ['idle'],
  error: ['intro', 'review', 'capture-ask', 'clarify-ask', 'idle']
};

// When user taps RETRY on error, map origin step → recovery step.
// Special-case: parsing-with-empty-extraction recovers to 'intro'
// (no data to review) — handled inline in clearError.
const ERROR_RECOVERY_STEP = {
  'capture-record': 'capture-ask',
  'clarify-record': 'clarify-ask',
  parsing: 'review',
  committing: 'review'
};

// ─── Store ────────────────────────────────────────────────────────────

export const onboardStore = map({ ...INITIAL_STATE });

// ─── Internal helpers ─────────────────────────────────────────────────

function patch(keys) {
  onboardStore.set({ ...onboardStore.get(), ...keys });
}

function reset() {
  onboardStore.set({
    ...INITIAL_STATE,
    matches: {},
    orphanAssignments: {},
    commitProgress: { total: 0, completed: 0, failed: [] }
  });
}

// ─── Transition guards ────────────────────────────────────────────────

export function canAdvance(currentStep, targetStep) {
  if (currentStep === targetStep) return true;
  const edges = VALID_EDGES[currentStep] || [];
  return edges.includes(targetStep);
}

function tryStep(targetStep, extraKeys = {}) {
  const cur = onboardStore.get();
  if (!canAdvance(cur.step, targetStep)) return false;
  patch({ step: targetStep, ...extraKeys });
  return true;
}

// ─── Slice mutators (explicit per slice — call sites read clearer) ────

function mutateExtractedProjects(fn) {
  const cur = onboardStore.get();
  if (cur.step !== 'review' || !cur.extracted) return;
  const projects = fn(
    cur.extracted.projects.map(p => ({
      ...p,
      tasks: p.tasks.map(t => ({ ...t }))
    }))
  );
  if (!projects) return;
  patch({ extracted: { ...cur.extracted, projects } });
}

function mutateExtractedOrphans(fn) {
  const cur = onboardStore.get();
  if (cur.step !== 'review' || !cur.extracted) return;
  const orphanTasks = fn(cur.extracted.orphanTasks.map(o => ({ ...o })));
  if (!orphanTasks) return;
  patch({ extracted: { ...cur.extracted, orphanTasks } });
}

function mutateMatches(fn) {
  const cur = onboardStore.get();
  if (cur.step !== 'review') return;
  const matches = fn({ ...cur.matches });
  if (!matches) return;
  patch({ matches });
}

function mutateOrphanAssignments(fn) {
  const cur = onboardStore.get();
  if (cur.step !== 'review') return;
  const orphanAssignments = fn({ ...cur.orphanAssignments });
  if (!orphanAssignments) return;
  patch({ orphanAssignments });
}

// ─── Lifecycle ────────────────────────────────────────────────────────

export function openOnboard() {
  reset();
  patch({ isActive: true, step: 'intro' });
}

export function closeOnboard(force = false) {
  const cur = onboardStore.get();
  if (force || cur.step === 'intro' || cur.step === 'idle' || cur.step === 'done') {
    reset();
    return;
  }
  patch({ exitConfirmOpen: true });
}

export function confirmExit() {
  reset();
}

export function cancelExit() {
  patch({ exitConfirmOpen: false });
}

export function beginCapture() {
  if (!tryStep('capture-ask')) return;
  patch({ transcriptLive: '', transcriptPending: '' });
}

// ─── Mic (shared capture + clarify, routed by current step) ───────────

export function startRecording() {
  const cur = onboardStore.get();
  let target = null;
  if (cur.step === 'capture-ask') target = 'capture-record';
  else if (cur.step === 'clarify-ask') target = 'clarify-record';
  if (!target) return;
  if (!tryStep(target)) return;
  patch({
    isRecording: true,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: ''
  });
}

export function updateLiveTranscript(text) {
  const cur = onboardStore.get();
  if (!cur.isRecording) return;
  patch({ transcriptLive: typeof text === 'string' ? text : '' });
}

export function stopRecording() {
  const cur = onboardStore.get();
  if (!cur.isRecording) return;
  patch({ isRecording: false, isTranscribing: true });
}

export function cancelRecording() {
  const cur = onboardStore.get();
  let target = null;
  if (cur.step === 'capture-record') target = 'capture-ask';
  else if (cur.step === 'clarify-record') target = 'clarify-ask';
  if (!target) return;
  patch({
    step: target,
    isRecording: false,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: ''
  });
}

export function finalizeCapture(finalText) {
  const cur = onboardStore.get();
  if (cur.step !== 'capture-record') return;
  const text = typeof finalText === 'string' ? finalText : '';
  patch({
    capture: text,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: text
  });
  startParsing();
}

export function finalizeClarify(finalText) {
  const cur = onboardStore.get();
  if (cur.step !== 'clarify-record') return;
  const text = typeof finalText === 'string' ? finalText : '';
  patch({
    clarify: text,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: text
  });
  startParsing();
}

export function skipClarify() {
  // Keep first-pass extracted as-is; skip to review. No second Opus call.
  if (!tryStep('review')) return;
  patch({ transcriptPending: '' });
}

// ─── Extraction ───────────────────────────────────────────────────────

export function startParsing() {
  if (!tryStep('parsing')) return;
  patch({ isExtracting: true });
}

// Apply Opus extraction payload. Routes to clarify-ask (first pass +
// Opus proposed a clarification) or review. Empty-projects + no-orphans
// outcome routes to error with a recoverable banner.
export function receiveExtraction(payload) {
  const cur = onboardStore.get();
  if (cur.step !== 'parsing') return;

  const rawProjects = Array.isArray(payload?.projects) ? payload.projects : [];
  const rawOrphans = Array.isArray(payload?.orphan_tasks) ? payload.orphan_tasks : [];
  const clarification = payload?.clarification_needed || null;

  if (rawProjects.length === 0 && rawOrphans.length === 0) {
    patch({
      isExtracting: false,
      extracted: { projects: [], orphanTasks: [], clarificationNeeded: null },
      step: 'error',
      error: {
        step: 'parsing',
        message: 'No projects detected. Try again?',
        recoverable: true
      }
    });
    return;
  }

  const stamp = Date.now();
  const projects = rawProjects.map((p, i) => ({
    tempId: `p-${stamp}-${i}`,
    name: p.name || '',
    category: p.category || null,
    urgent: Boolean(p.urgent),
    note: p.note || '',
    matched_existing_id: p.matched_existing_id || null,
    match_confidence: typeof p.match_confidence === 'number' ? p.match_confidence : 0,
    committed: false,
    backendId: null,
    tasks: Array.isArray(p.tasks)
      ? p.tasks.map((t, j) => ({
          tempId: `t-${stamp}-${i}-${j}`,
          text: t.text || '',
          urgent: Boolean(t.urgent),
          category: t.category || null,
          committed: false
        }))
      : []
  }));

  const orphanTasks = rawOrphans.map((o, i) => ({
    tempId: `o-${stamp}-${i}`,
    text: o.text || '',
    urgent: Boolean(o.urgent),
    category: o.category || null,
    suggestedProjectName: o.suggested_new_project_name || null,
    committed: false
  }));

  const extracted = {
    projects,
    orphanTasks,
    clarificationNeeded: clarification && typeof clarification.question === 'string'
      ? { question: clarification.question }
      : null
  };

  // Only trigger clarify on first pass. If we already have a clarify
  // transcript, a second-pass clarification is ignored — we've asked once.
  const isFirstPass = cur.clarify === null;

  if (isFirstPass && extracted.clarificationNeeded) {
    patch({
      isExtracting: false,
      extracted,
      matches: initMatchesFromProjects(projects),
      step: 'clarify-ask'
    });
    return;
  }

  patch({
    isExtracting: false,
    extracted,
    matches: initMatchesFromProjects(projects),
    orphanAssignments: {},
    step: 'review'
  });
}

function initMatchesFromProjects(projects) {
  const matches = {};
  for (const p of projects) {
    if (!p.matched_existing_id) continue;
    const c = p.match_confidence;
    if (c >= MATCH_CONFIDENCE_HIGH) matches[p.tempId] = { merge: true };
    else if (c < MATCH_CONFIDENCE_LOW) matches[p.tempId] = { merge: false };
    // confidence between thresholds → leave undecided, force review choice
  }
  return matches;
}

// ─── Review — projects ────────────────────────────────────────────────

export function editProjectName(idx, newName) {
  mutateExtractedProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].name = typeof newName === 'string' ? newName : projects[idx].name;
    return projects;
  });
}

export function editProjectCategory(idx, newCategory) {
  mutateExtractedProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].category = newCategory || null;
    return projects;
  });
}

export function toggleProjectUrgent(idx) {
  mutateExtractedProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].urgent = !projects[idx].urgent;
    return projects;
  });
}

export function editProjectNote(idx, newNote) {
  mutateExtractedProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].note = typeof newNote === 'string' ? newNote : projects[idx].note;
    return projects;
  });
}

export function deleteProject(idx) {
  const cur = onboardStore.get();
  if (cur.step !== 'review' || !cur.extracted) return;
  const target = cur.extracted.projects[idx];
  if (!target) return;
  const tempId = target.tempId;

  mutateExtractedProjects(projects => {
    projects.splice(idx, 1);
    return projects;
  });
  // Prune stale match decision + any orphan assignments pointing here.
  mutateMatches(m => {
    if (tempId in m) delete m[tempId];
    return m;
  });
  mutateOrphanAssignments(a => {
    for (const oid of Object.keys(a)) {
      if (a[oid]?.kind === 'new-extracted' && a[oid].projectTempId === tempId) {
        delete a[oid];
      }
    }
    return a;
  });
}

export function addProject() {
  mutateExtractedProjects(projects => {
    const stamp = Date.now();
    projects.push({
      tempId: `p-${stamp}-${projects.length}`,
      name: '',
      category: null,
      urgent: false,
      note: '',
      matched_existing_id: null,
      match_confidence: 0,
      committed: false,
      backendId: null,
      tasks: []
    });
    return projects;
  });
}

export function reorderProjects(fromIdx, toIdx) {
  mutateExtractedProjects(projects => {
    if (fromIdx === toIdx) return null;
    if (!projects[fromIdx]) return null;
    if (toIdx < 0 || toIdx > projects.length - 1) return null;
    const [moved] = projects.splice(fromIdx, 1);
    projects.splice(toIdx, 0, moved);
    return projects;
  });
}

// ─── Review — tasks ───────────────────────────────────────────────────

export function editTaskText(projectIdx, taskIdx, newText) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks[taskIdx].text = typeof newText === 'string' ? newText : p.tasks[taskIdx].text;
    return projects;
  });
}

export function toggleTaskUrgent(projectIdx, taskIdx) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks[taskIdx].urgent = !p.tasks[taskIdx].urgent;
    return projects;
  });
}

export function editTaskCategory(projectIdx, taskIdx, newCategory) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks[taskIdx].category = newCategory || null;
    return projects;
  });
}

export function deleteTask(projectIdx, taskIdx) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks.splice(taskIdx, 1);
    return projects;
  });
}

export function addTask(projectIdx) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p) return null;
    const stamp = Date.now();
    p.tasks.push({
      tempId: `t-${stamp}-${projectIdx}-${p.tasks.length}`,
      text: '',
      urgent: false,
      category: null,
      committed: false
    });
    return projects;
  });
}

export function reorderTasks(projectIdx, fromIdx, toIdx) {
  mutateExtractedProjects(projects => {
    const p = projects[projectIdx];
    if (!p) return null;
    if (fromIdx === toIdx) return null;
    if (!p.tasks[fromIdx]) return null;
    if (toIdx < 0 || toIdx > p.tasks.length - 1) return null;
    const [moved] = p.tasks.splice(fromIdx, 1);
    p.tasks.splice(toIdx, 0, moved);
    return projects;
  });
}

// ─── Review — match decisions ─────────────────────────────────────────

export function setMatchDecision(projectTempId, merge) {
  mutateMatches(m => {
    m[projectTempId] = { merge: Boolean(merge) };
    return m;
  });
}

// ─── Review — orphans ─────────────────────────────────────────────────

export function editOrphanText(orphanTempId, newText) {
  mutateExtractedOrphans(orphans => {
    const o = orphans.find(x => x.tempId === orphanTempId);
    if (!o) return null;
    o.text = typeof newText === 'string' ? newText : o.text;
    return orphans;
  });
}

export function toggleOrphanUrgent(orphanTempId) {
  mutateExtractedOrphans(orphans => {
    const o = orphans.find(x => x.tempId === orphanTempId);
    if (!o) return null;
    o.urgent = !o.urgent;
    return orphans;
  });
}

export function editOrphanCategory(orphanTempId, newCategory) {
  mutateExtractedOrphans(orphans => {
    const o = orphans.find(x => x.tempId === orphanTempId);
    if (!o) return null;
    o.category = newCategory || null;
    return orphans;
  });
}

// assignment shape — tagged union:
//   { kind: 'existing',      existingId: string }
//   { kind: 'new-extracted', projectTempId: string }   // attach to a project in extracted.projects
//   { kind: 'new-adhoc',     newName: string }          // spin up a new project at commit time
//   { kind: 'deleted' }
export function assignOrphan(orphanTempId, assignment) {
  if (!assignment || typeof assignment.kind !== 'string') return;
  mutateOrphanAssignments(a => {
    a[orphanTempId] = { ...assignment };
    return a;
  });
}

export function deleteOrphan(orphanTempId) {
  assignOrphan(orphanTempId, { kind: 'deleted' });
}

// ─── Commit markers (module-private) ──────────────────────────────────

function markProjectCommitted(idx, backendId) {
  const cur = onboardStore.get();
  if (!cur.extracted) return;
  const projects = cur.extracted.projects.map((p, i) =>
    i === idx
      ? { ...p, committed: true, backendId, tasks: p.tasks.map(t => ({ ...t })) }
      : { ...p, tasks: p.tasks.map(t => ({ ...t })) }
  );
  patch({ extracted: { ...cur.extracted, projects } });
}

function markTaskCommitted(projectIdx, taskIdx) {
  const cur = onboardStore.get();
  if (!cur.extracted) return;
  const projects = cur.extracted.projects.map((p, i) => {
    if (i !== projectIdx) return { ...p, tasks: p.tasks.map(t => ({ ...t })) };
    return {
      ...p,
      tasks: p.tasks.map((t, j) =>
        j === taskIdx ? { ...t, committed: true } : { ...t }
      )
    };
  });
  patch({ extracted: { ...cur.extracted, projects } });
}

function markOrphanCommitted(orphanTempId) {
  const cur = onboardStore.get();
  if (!cur.extracted) return;
  const orphanTasks = cur.extracted.orphanTasks.map(o =>
    o.tempId === orphanTempId ? { ...o, committed: true } : { ...o }
  );
  patch({ extracted: { ...cur.extracted, orphanTasks } });
}

// ─── Commit lifecycle ─────────────────────────────────────────────────

export function startCommit() {
  const cur = onboardStore.get();
  if (!tryStep('committing')) return;
  const projects = cur.extracted?.projects || [];
  const orphans = cur.extracted?.orphanTasks || [];
  const assignments = cur.orphanAssignments || {};

  // Slot count: one per project (create OR merge-accept) + one per task +
  // one per non-deleted orphan (ad-hoc orphans still count as one user-
  // visible "commit" even though they do two API calls internally).
  let total = 0;
  for (const p of projects) total += 1 + p.tasks.length;
  for (const o of orphans) {
    const a = assignments[o.tempId];
    if (a && a.kind !== 'deleted') total += 1;
  }

  // Pre-seed completed from any prior committed flags (selective retry).
  let alreadyCommitted = 0;
  for (const p of projects) {
    if (p.committed) alreadyCommitted++;
    alreadyCommitted += p.tasks.filter(t => t.committed).length;
  }
  for (const o of orphans) {
    if (o.committed) alreadyCommitted++;
  }

  patch({
    committing: true,
    commitProgress: { total, completed: alreadyCommitted, failed: [] }
  });
}

export function updateCommitProgress(completed, failed) {
  const cur = onboardStore.get();
  if (cur.step !== 'committing') return;
  patch({
    commitProgress: {
      total: cur.commitProgress.total,
      completed: typeof completed === 'number' ? completed : cur.commitProgress.completed,
      failed: Array.isArray(failed) ? failed : cur.commitProgress.failed
    }
  });
}

export function finishCommit() {
  const cur = onboardStore.get();
  if (cur.step !== 'committing') return;
  const { failed } = cur.commitProgress;
  if (failed.length === 0) {
    patch({ committing: false, step: 'done' });
  } else {
    patch({
      committing: false,
      step: 'error',
      error: {
        step: 'committing',
        message: `${failed.length} item${failed.length === 1 ? '' : 's'} failed to commit. Retry?`,
        recoverable: true
      }
    });
  }
}

// ─── Error lifecycle ──────────────────────────────────────────────────

export function setError(step, message, recoverable = true) {
  patch({
    step: 'error',
    error: { step, message: message || 'Something went wrong.', recoverable: Boolean(recoverable) },
    isRecording: false,
    isTranscribing: false,
    isExtracting: false,
    committing: false
  });
}

export function clearError() {
  const cur = onboardStore.get();
  if (cur.step !== 'error' || !cur.error) return;
  const origin = cur.error.step;
  const recovery = ERROR_RECOVERY_STEP[origin] || 'intro';
  // Parsing error with nothing extracted: no review data to return to;
  // send the user back to intro to retry the whole capture.
  const noExtracted = origin === 'parsing' && (!cur.extracted || (
    cur.extracted.projects.length === 0 && cur.extracted.orphanTasks.length === 0
  ));
  patch({
    step: noExtracted ? 'intro' : recovery,
    error: null
  });
}

export function recoverToIntro() {
  const cur = onboardStore.get();
  const wasActive = cur.isActive;
  reset();
  patch({ isActive: wasActive, step: 'intro' });
}

// ─── Selectors ────────────────────────────────────────────────────────

export function hasCapture() {
  return Boolean(onboardStore.get().capture);
}

export function hasClarify() {
  return Boolean(onboardStore.get().clarify);
}

export function isSecondPass() {
  const { step, clarify } = onboardStore.get();
  return step === 'parsing' && clarify !== null;
}

export function needsClarification() {
  const { extracted, clarify } = onboardStore.get();
  return Boolean(extracted?.clarificationNeeded && !clarify);
}

export function pendingMatchDecisions() {
  const { extracted, matches } = onboardStore.get();
  if (!extracted) return [];
  return extracted.projects
    .filter(p => p.matched_existing_id && matches[p.tempId] === undefined)
    .map(p => p.tempId);
}

export function pendingOrphanAssignments() {
  const { extracted, orphanAssignments } = onboardStore.get();
  if (!extracted) return [];
  return extracted.orphanTasks
    .filter(o => !orphanAssignments[o.tempId])
    .map(o => o.tempId);
}

export function isReadyToCommit() {
  const cur = onboardStore.get();
  if (cur.step !== 'review' || !cur.extracted) return false;
  if (pendingMatchDecisions().length > 0) return false;
  if (pendingOrphanAssignments().length > 0) return false;
  const names = cur.extracted.projects.map(p => (p.name || '').trim());
  if (names.some(n => !n)) return false;
  return true;
}

// ─── Commit orchestrator ──────────────────────────────────────────────
// Sequential, selective-retry-aware. Passes:
//   1. Matched projects with merge=true — stamp committed + backendId
//      (matched_existing_id) synchronously. No API call; task loop will
//      attach tasks under the existing project.
//   2. Non-matched (or merge=false) projects — /api/project op:add.
//   3. Tasks under each committed project — /api/backlog op:add.
//   4. Orphan tasks — dispatch by orphanAssignments[tempId].kind.
//
// Already-committed items (p.committed / t.committed / o.committed) are
// skipped at every pass, so a retry resumes where the last attempt stopped.
// Never throws; failures accumulate in commitProgress.failed; caller routes
// via finishCommit().
//
// Task payload uses forward-looking schema (urgent: bool, order: int). The
// api/backlog.js add op is expected to accept these (see phase4 redesign
// spec § Backend change required). R2.5 extends the backend add op; until
// then unknown fields round-trip silently on the current handler.

export async function commitOnboardingResults() {
  const cur = onboardStore.get();
  if (cur.step !== 'committing') return;

  let completed = cur.commitProgress.completed;
  const failed = [];
  const bump = () => updateCommitProgress(completed, [...failed]);

  // ─── Pass 1: accept matched-merge decisions (no API call) ─────────
  {
    const snapshot = onboardStore.get().extracted?.projects || [];
    const matches = onboardStore.get().matches || {};
    for (let pIdx = 0; pIdx < snapshot.length; pIdx++) {
      const p = snapshot[pIdx];
      if (p.committed) continue;
      if (!p.matched_existing_id) continue;
      const decision = matches[p.tempId];
      if (!decision || decision.merge !== true) continue;
      markProjectCommitted(pIdx, p.matched_existing_id);
      completed++;
      bump();
    }
  }

  // ─── Pass 2: create non-matched (or create-new-override) projects ─
  {
    const snapshot = onboardStore.get().extracted?.projects || [];
    for (let pIdx = 0; pIdx < snapshot.length; pIdx++) {
      const p = onboardStore.get().extracted.projects[pIdx];
      if (p.committed) continue;

      const name = (p.name || '').trim();
      if (!name) {
        failed.push({ kind: 'project', name: '(unnamed)', reason: 'empty name' });
        for (const t of p.tasks) {
          if (!t.committed) {
            failed.push({
              kind: 'task',
              project: '(unnamed)',
              text: t.text || '(empty)',
              reason: 'parent project failed'
            });
          }
        }
        bump();
        continue;
      }

      try {
        const res = await projectOp({
          op: 'add',
          name,
          ...(p.note ? { note: p.note } : {})
        });
        const projectId = res?.project?.id || null;
        if (!projectId) throw new Error('no project id returned');
        markProjectCommitted(pIdx, projectId);
        completed++;
        bump();
      } catch (err) {
        failed.push({ kind: 'project', name, reason: err?.message || 'unknown' });
        for (const t of p.tasks) {
          if (!t.committed) {
            failed.push({
              kind: 'task',
              project: name,
              text: t.text || '(empty)',
              reason: 'parent project failed'
            });
          }
        }
        bump();
      }
    }
  }

  // ─── Pass 3: attach tasks under each committed project ────────────
  {
    const snapshot = onboardStore.get().extracted?.projects || [];
    for (let pIdx = 0; pIdx < snapshot.length; pIdx++) {
      const p = onboardStore.get().extracted.projects[pIdx];
      if (!p.committed || !p.backendId) continue;

      for (let tIdx = 0; tIdx < p.tasks.length; tIdx++) {
        const t = p.tasks[tIdx];
        if (t.committed) continue;

        const text = (t.text || '').trim();
        if (!text) {
          failed.push({ kind: 'task', project: p.name, text: '(empty)', reason: 'empty text' });
          bump();
          continue;
        }

        try {
          await backlogOp({
            op: 'add',
            project_id: p.backendId,
            task: {
              text,
              urgent: t.urgent,
              order: tIdx,
              ...(t.category ? { category: t.category } : {})
            }
          });
          markTaskCommitted(pIdx, tIdx);
          completed++;
          bump();
        } catch (err) {
          failed.push({
            kind: 'task',
            project: p.name,
            text,
            reason: err?.message || 'unknown'
          });
          bump();
        }
      }
    }
  }

  // ─── Pass 4: orphan tasks ─────────────────────────────────────────
  {
    const orphans = onboardStore.get().extracted?.orphanTasks || [];
    for (const orphan of orphans) {
      if (orphan.committed) continue;
      const assignment = onboardStore.get().orphanAssignments[orphan.tempId];

      if (!assignment || assignment.kind === 'deleted') {
        // Deleted orphans still get marked committed so retries skip them.
        // They weren't counted in `total`, so don't bump `completed`.
        markOrphanCommitted(orphan.tempId);
        continue;
      }

      const text = (orphan.text || '').trim();
      if (!text) {
        failed.push({ kind: 'orphan', text: '(empty)', reason: 'empty text' });
        bump();
        continue;
      }

      // Resolve target project_id by assignment kind.
      let projectId = null;
      let projectLabel = '(orphan target)';
      try {
        if (assignment.kind === 'existing') {
          projectId = assignment.existingId;
          projectLabel = assignment.existingId || projectLabel;
          if (!projectId) throw new Error('existing project id missing');
        } else if (assignment.kind === 'new-extracted') {
          const target = onboardStore
            .get()
            .extracted.projects.find(x => x.tempId === assignment.projectTempId);
          projectId = target?.backendId || null;
          projectLabel = target?.name || projectLabel;
          if (!projectId) throw new Error('target project not committed');
        } else if (assignment.kind === 'new-adhoc') {
          const name = (assignment.newName || '').trim();
          if (!name) throw new Error('ad-hoc project name missing');
          projectLabel = name;
          const res = await projectOp({ op: 'add', name });
          projectId = res?.project?.id || null;
          if (!projectId) throw new Error('no project id returned for ad-hoc');
        } else {
          throw new Error(`unknown assignment kind: ${assignment.kind}`);
        }
      } catch (err) {
        failed.push({ kind: 'orphan', text, reason: err?.message || 'unknown' });
        bump();
        continue;
      }

      try {
        await backlogOp({
          op: 'add',
          project_id: projectId,
          task: {
            text,
            urgent: orphan.urgent,
            ...(orphan.category ? { category: orphan.category } : {})
          }
        });
        markOrphanCommitted(orphan.tempId);
        completed++;
        bump();
      } catch (err) {
        failed.push({
          kind: 'orphan',
          text,
          project: projectLabel,
          reason: err?.message || 'unknown'
        });
        bump();
      }
    }
  }

  updateCommitProgress(completed, failed);
  finishCommit();
}

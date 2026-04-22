// Onboarding state store. Phase 4 — three-question voice flow → Opus
// extraction → review → LOCK IT IN commit. See /vault/build/phase4-plan.md.
//
// Pure state. No fetch, no api.js, no voice.js — components drive those
// side effects and dispatch back into this store. Invalid transitions
// are no-ops so mis-ordered dispatches can't crash the surface.

import { map } from 'nanostores';
import { projectOp, backlogOp } from '../lib/api.js';

export const onboardStore = map({
  step: 'idle',
  isActive: false,

  currentQuestion: 0,
  isRecording: false,
  isTranscribing: false,
  transcriptLive: '',
  transcriptPending: '',

  answers: { q1: null, q2: null, q3: null },

  isExtracting: false,
  extracted: null,

  committing: false,
  commitProgress: { total: 0, completed: 0, failed: [] },

  error: null,

  exitConfirmOpen: false
});

const INITIAL_STATE = {
  step: 'idle',
  isActive: false,
  currentQuestion: 0,
  isRecording: false,
  isTranscribing: false,
  transcriptLive: '',
  transcriptPending: '',
  answers: { q1: null, q2: null, q3: null },
  isExtracting: false,
  extracted: null,
  committing: false,
  commitProgress: { total: 0, completed: 0, failed: [] },
  error: null,
  exitConfirmOpen: false
};

function patch(keys) {
  onboardStore.set({ ...onboardStore.get(), ...keys });
}

function reset() {
  onboardStore.set({ ...INITIAL_STATE, answers: { q1: null, q2: null, q3: null }, commitProgress: { total: 0, completed: 0, failed: [] } });
}

// ─── Transition validation ────────────────────────────────────────────

// Valid "from → to" step edges. Any edge not listed is a no-op.
// Error edges (any step → error) are handled outside this map.
const VALID_EDGES = {
  idle: ['intro'],
  intro: ['q1-ask', 'idle'],
  'q1-ask': ['q1-record', 'intro', 'idle'],
  'q1-record': ['q2-ask', 'q1-ask', 'idle'],
  'q2-ask': ['q2-record', 'idle'],
  'q2-record': ['q3-ask', 'q2-ask', 'idle'],
  'q3-ask': ['q3-record', 'idle'],
  'q3-record': ['parsing', 'q3-ask', 'idle'],
  parsing: ['review', 'idle'],
  review: ['committing', 'idle'],
  committing: ['done', 'idle'],
  done: ['idle'],
  error: ['intro', 'idle']
};

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

// ─── Derived state ────────────────────────────────────────────────────

export function hasCapturedAnyAnswers() {
  const { answers } = onboardStore.get();
  return Boolean(answers.q1 || answers.q2 || answers.q3);
}

// ─── Core lifecycle ───────────────────────────────────────────────────

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

export function beginQuestions() {
  if (!tryStep('q1-ask')) return;
  patch({ currentQuestion: 1, transcriptLive: '', transcriptPending: '' });
}

// ─── Per-question mic lifecycle ───────────────────────────────────────

export function startAsking(qNum) {
  if (![1, 2, 3].includes(qNum)) return;
  const targetStep = `q${qNum}-ask`;
  if (!tryStep(targetStep)) return;
  patch({
    currentQuestion: qNum,
    isRecording: false,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: ''
  });
}

export function startRecording() {
  const cur = onboardStore.get();
  const qNum = cur.currentQuestion;
  if (![1, 2, 3].includes(qNum)) return;
  const targetStep = `q${qNum}-record`;
  if (!tryStep(targetStep)) return;
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

export function finalizeTranscript(finalText) {
  const cur = onboardStore.get();
  const qNum = cur.currentQuestion;
  if (![1, 2, 3].includes(qNum)) return;
  if (cur.step !== `q${qNum}-record`) return;

  const text = typeof finalText === 'string' ? finalText : '';
  const answers = { ...cur.answers, [`q${qNum}`]: text };
  patch({
    answers,
    isTranscribing: false,
    transcriptLive: '',
    transcriptPending: text
  });

  if (qNum < 3) {
    startAsking(qNum + 1);
  } else {
    startParsing();
  }
}

// ─── Extraction ───────────────────────────────────────────────────────

export function startParsing() {
  if (!tryStep('parsing')) return;
  patch({ isExtracting: true });
}

export function receiveExtraction(projects) {
  const cur = onboardStore.get();
  if (cur.step !== 'parsing') return;
  const list = Array.isArray(projects) ? projects : [];
  if (list.length === 0) {
    patch({
      isExtracting: false,
      extracted: { projects: [] },
      step: 'error',
      error: { step: 'parsing', message: 'No projects detected. Try again?', recoverable: true }
    });
    return;
  }
  // Assign stable client-side ids for the review surface; backend assigns
  // its own ids at commit time.
  const withIds = list.map((p, i) => ({
    tempId: `p-${Date.now()}-${i}`,
    name: p.name || '',
    category: p.category || null,
    priority: typeof p.priority === 'number' ? p.priority : 3,
    note: p.note || '',
    committed: false,
    backendId: null,
    tasks: Array.isArray(p.tasks)
      ? p.tasks.map((t, j) => ({
          tempId: `t-${Date.now()}-${i}-${j}`,
          text: t.text || '',
          priority: typeof t.priority === 'number' ? t.priority : 3,
          category: t.category || null,
          committed: false
        }))
      : []
  }));
  patch({
    isExtracting: false,
    extracted: { projects: withIds },
    step: 'review'
  });
}

// ─── Review edits ─────────────────────────────────────────────────────

function mutateProjects(fn) {
  const cur = onboardStore.get();
  if (cur.step !== 'review' || !cur.extracted) return;
  const projects = fn(cur.extracted.projects.map(p => ({
    ...p,
    tasks: p.tasks.map(t => ({ ...t }))
  })));
  if (!projects) return;
  patch({ extracted: { ...cur.extracted, projects } });
}

export function editProjectName(idx, newName) {
  mutateProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].name = typeof newName === 'string' ? newName : projects[idx].name;
    return projects;
  });
}

export function editProjectCategory(idx, newCategory) {
  mutateProjects(projects => {
    if (!projects[idx]) return null;
    projects[idx].category = newCategory || null;
    return projects;
  });
}

export function editProjectPriority(idx, newPriority) {
  mutateProjects(projects => {
    if (!projects[idx]) return null;
    const p = Number(newPriority);
    if (!Number.isInteger(p) || p < 1 || p > 5) return null;
    projects[idx].priority = p;
    return projects;
  });
}

export function deleteProject(idx) {
  mutateProjects(projects => {
    if (!projects[idx]) return null;
    projects.splice(idx, 1);
    return projects;
  });
}

export function addProject() {
  mutateProjects(projects => {
    projects.push({
      tempId: `p-${Date.now()}-${projects.length}`,
      name: '',
      category: null,
      priority: 3,
      note: '',
      committed: false,
      backendId: null,
      tasks: []
    });
    return projects;
  });
}

export function editTaskText(projectIdx, taskIdx, newText) {
  mutateProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks[taskIdx].text = typeof newText === 'string' ? newText : p.tasks[taskIdx].text;
    return projects;
  });
}

export function editTaskPriority(projectIdx, taskIdx, newPriority) {
  mutateProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    const n = Number(newPriority);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    p.tasks[taskIdx].priority = n;
    return projects;
  });
}

export function deleteTask(projectIdx, taskIdx) {
  mutateProjects(projects => {
    const p = projects[projectIdx];
    if (!p || !p.tasks[taskIdx]) return null;
    p.tasks.splice(taskIdx, 1);
    return projects;
  });
}

export function addTask(projectIdx) {
  mutateProjects(projects => {
    const p = projects[projectIdx];
    if (!p) return null;
    p.tasks.push({
      tempId: `t-${Date.now()}-${projectIdx}-${p.tasks.length}`,
      text: '',
      priority: 3,
      category: null,
      committed: false
    });
    return projects;
  });
}

// ─── Commit lifecycle ─────────────────────────────────────────────────

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

export function startCommit() {
  const cur = onboardStore.get();
  if (!tryStep('committing')) return;
  const projects = cur.extracted?.projects || [];
  const total = projects.reduce((sum, p) => sum + 1 + p.tasks.length, 0);
  const alreadyCommitted = projects.reduce((sum, p) => {
    const pDone = p.committed ? 1 : 0;
    const tDone = p.tasks.filter(t => t.committed).length;
    return sum + pDone + tDone;
  }, 0);
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

// Step to recover to when user taps "retry" on a given error origin.
const ERROR_RECOVERY_STEP = {
  'q1-record': 'q1-ask',
  'q2-record': 'q2-ask',
  'q3-record': 'q3-ask',
  parsing: 'review',
  committing: 'review'
};

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
  // Special-case: parsing→error with empty extraction recovers to intro
  // (no extracted data to review), not review.
  const noExtracted = origin === 'parsing' && (!cur.extracted || !cur.extracted.projects.length);
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

// ─── Commit orchestrator ──────────────────────────────────────────────
// Sequentially creates each project via /api/project op:add, then each
// task under that project via /api/backlog op:add. Updates
// commitProgress after every API call so the review surface can render a
// live "N of M" indicator. Failures are collected into commitProgress.failed
// with enough detail to retry (project name + task text). Does NOT throw;
// returns when all items have been attempted. Caller invokes finishCommit()
// which inspects commitProgress.failed to route to 'done' or 'error'.

export async function commitOnboardingResults() {
  const cur = onboardStore.get();
  if (cur.step !== 'committing') return;
  const projects = cur.extracted?.projects || [];

  let completed = cur.commitProgress.completed;
  const failed = [];

  const bumpProgress = () => {
    updateCommitProgress(completed, [...failed]);
  };

  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const p = onboardStore.get().extracted.projects[pIdx];

    let projectId = p.backendId;
    if (!p.committed) {
      const name = (p.name || '').trim();
      if (!name) {
        failed.push({ kind: 'project', name: '(unnamed)', reason: 'empty name' });
        for (const t of (p.tasks || [])) {
          if (!t.committed) {
            failed.push({
              kind: 'task',
              project: '(unnamed)',
              text: t.text || '(empty)',
              reason: 'parent project failed'
            });
          }
        }
        bumpProgress();
        continue;
      }
      try {
        const res = await projectOp({
          op: 'add',
          name,
          priority: p.priority,
          ...(p.note ? { note: p.note } : {})
        });
        projectId = res?.project?.id || null;
        if (!projectId) throw new Error('no project id returned');
        markProjectCommitted(pIdx, projectId);
        completed++;
        bumpProgress();
      } catch (err) {
        failed.push({ kind: 'project', name, reason: err?.message || 'unknown' });
        for (const t of (p.tasks || [])) {
          if (!t.committed) {
            failed.push({
              kind: 'task',
              project: name,
              text: t.text || '(empty)',
              reason: 'parent project failed'
            });
          }
        }
        bumpProgress();
        continue;
      }
    }

    const refreshed = onboardStore.get().extracted.projects[pIdx];
    for (let tIdx = 0; tIdx < refreshed.tasks.length; tIdx++) {
      const t = refreshed.tasks[tIdx];
      if (t.committed) continue;

      const text = (t.text || '').trim();
      if (!text) {
        failed.push({ kind: 'task', project: refreshed.name, text: '(empty)', reason: 'empty text' });
        bumpProgress();
        continue;
      }
      try {
        await backlogOp({
          op: 'add',
          project_id: projectId,
          task: {
            text,
            priority: t.priority,
            ...(t.category ? { category: t.category } : {})
          }
        });
        markTaskCommitted(pIdx, tIdx);
        completed++;
        bumpProgress();
      } catch (err) {
        failed.push({ kind: 'task', project: refreshed.name, text, reason: err?.message || 'unknown' });
        bumpProgress();
      }
    }
  }

  updateCommitProgress(completed, failed);
  finishCommit();
}

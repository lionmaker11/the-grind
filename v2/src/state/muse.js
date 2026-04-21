// Muse state store. Phase 3 — the voice loop nanostore.
//
// Shape locked per kickoff Q3. See DESIGN.md §5 + §6. Actions dispatched
// from the Muse UI components; send() handles the end-to-end loop:
//   user message -> /api/chief -> tool calls -> /api/backlog or /api/project
// Board re-fetch is triggered by Board.jsx subscribing to lastActionAt.

import { map } from 'nanostores';
import {
  postChief,
  postTranscribe,
  backlogOp,
  projectOp
} from '../lib/api.js';
import { startRecording } from '../lib/voice.js';

const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

export const museStore = map({
  isOpen: false,
  messages: [],
  isRecording: false,
  isTranscribing: false,
  isSending: false,
  isOnline: initialOnline,
  voiceText: '',
  status: initialOnline ? 'idle' : 'offline',
  lastAction: null,
  lastActionAt: 0,
  prefill: ''
});

let recordingHandle = null;

function mkMsg(role, content, extras = {}) {
  const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return { id, role, content, ts: Date.now(), ...extras };
}

function patch(keys) {
  museStore.set({ ...museStore.get(), ...keys });
}

function appendMessage(msg) {
  const cur = museStore.get();
  museStore.setKey('messages', [...cur.messages, msg]);
}

export function open(opts = {}) {
  const cur = museStore.get();
  patch({
    isOpen: true,
    prefill: opts.prefill || '',
    status: cur.isOnline ? (cur.status === 'error' ? 'idle' : cur.status) : 'offline'
  });
  if (cur.status === 'error') patch({ status: cur.isOnline ? 'idle' : 'offline' });
}

export function close() {
  if (recordingHandle) {
    try { recordingHandle.cancel?.(); } catch (_e) { /* already stopped */ }
    recordingHandle = null;
  }
  patch({
    isOpen: false,
    isRecording: false,
    isTranscribing: false,
    prefill: '',
    voiceText: ''
  });
}

export async function recordStart() {
  const cur = museStore.get();
  if (cur.isRecording || cur.isSending || cur.isTranscribing || !cur.isOnline) return;
  try {
    recordingHandle = await startRecording();
    patch({ isRecording: true, status: 'listening' });
  } catch (err) {
    recordingHandle = null;
    patch({ isRecording: false, status: 'error' });
    appendMessage(mkMsg('action', `// ERROR · ${err?.message || 'mic unavailable'}`, { variant: 'error' }));
  }
}

export async function recordStop() {
  if (!recordingHandle) return '';
  const handle = recordingHandle;
  recordingHandle = null;
  patch({ isRecording: false, isTranscribing: true, status: 'transcribing' });
  try {
    const blob = await handle.stop();
    const transcript = await postTranscribe(blob);
    patch({ isTranscribing: false, voiceText: transcript || '', status: 'idle' });
    return transcript || '';
  } catch (err) {
    patch({ isTranscribing: false, voiceText: '', status: 'error' });
    appendMessage(mkMsg('action', `// ERROR · ${err?.message || 'transcription failed'}`, { variant: 'error' }));
    return '';
  }
}

// ─── action dispatcher ──────────────────────────────────────────────────

const TOOL_LABELS = {
  add_to_backlog:        (a) => `new task added to ${a.project_id}`,
  set_task_priority:     (a) => `priority set · ${a.task_id} → P${a.priority}`,
  complete_backlog_task: (a) => `completed · ${a.task_id}`,
  remove_from_backlog:   (a) => `removed · ${a.task_id}`,
  reorder_backlog:       (a) => `reordered · ${a.project_id}`,
  add_project:           (a) => `new project · ${a.name}`,
  archive_project:       (a) => `archived · ${a.project_id}`,
  activate_project:      (a) => `activated · ${a.project_id}`
};

function actionToApiCall(action) {
  const { type } = action;
  switch (type) {
    case 'add_to_backlog':
      return backlogOp({
        op: 'add',
        project_id: action.project_id,
        task: {
          text: action.text,
          priority: action.priority,
          done_condition: action.done_condition,
          category: action.category,
          estimated_pomodoros: action.estimated_pomodoros
        }
      });
    case 'set_task_priority':
      return backlogOp({
        op: 'set_priority',
        project_id: action.project_id,
        task_id: action.task_id,
        priority: action.priority
      });
    case 'complete_backlog_task':
      return backlogOp({ op: 'complete', project_id: action.project_id, task_id: action.task_id });
    case 'remove_from_backlog':
      return backlogOp({ op: 'remove', project_id: action.project_id, task_id: action.task_id });
    case 'reorder_backlog':
      return backlogOp({ op: 'reorder', project_id: action.project_id, order: action.order });
    case 'add_project':
      return projectOp({
        op: 'add',
        name: action.name,
        priority: action.priority,
        aliases: action.aliases,
        note: action.note
      });
    case 'archive_project':
      return projectOp({ op: 'archive', project_id: action.project_id });
    case 'activate_project':
      return projectOp({ op: 'activate', project_id: action.project_id });
    default:
      return Promise.reject(new Error(`unknown action type: ${type}`));
  }
}

async function runOne(action) {
  try {
    await actionToApiCall(action);
    const label = TOOL_LABELS[action.type] ? TOOL_LABELS[action.type](action) : action.type;
    appendMessage(mkMsg('action', `+ ${label}`));
    patch({ lastAction: label, lastActionAt: Date.now() });
  } catch (err) {
    appendMessage(mkMsg('action', `// ERROR · ${action.type} failed (${err?.message || 'unknown'})`, { variant: 'error' }));
  }
}

// Parallelism rules (Q3 confirmed):
//   - > 5 actions: serialize everything (rate-limit safety)
//   - else: group by project_id, serialize within group, Promise.all across groups.
async function executeActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  if (actions.length > 5) {
    for (const a of actions) { await runOne(a); }
    return;
  }
  const groups = new Map();
  actions.forEach((a, i) => {
    const key = a.project_id || `__solo_${i}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  });
  await Promise.all([...groups.values()].map(async (group) => {
    for (const a of group) { await runOne(a); }
  }));
}

// ─── send ──────────────────────────────────────────────────────────────

export async function send(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return;
  const cur = museStore.get();
  if (cur.isSending) return;

  appendMessage(mkMsg('user', trimmed));
  patch({ isSending: true, status: 'thinking', voiceText: '' });

  // Build conversation from prior user+muse messages (exclude the one we
  // just appended; chief appends that from the `message` field).
  const conversation = museStore.get().messages
    .filter((m) => m.role === 'user' || m.role === 'muse')
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'muse' ? 'assistant' : 'user',
      content: m.content
    }));

  try {
    const res = await postChief({
      mode: 'muse',
      message: trimmed,
      conversation,
      firstTurnToday: false
    });
    if (res.text) appendMessage(mkMsg('muse', res.text));
    patch({ isSending: false, status: 'response' });

    if (Array.isArray(res.actions) && res.actions.length > 0) {
      await executeActions(res.actions);
    }
  } catch (err) {
    patch({ isSending: false, status: 'error' });
    appendMessage(mkMsg('action', `// ERROR · ${err?.message || 'muse unreachable'}`, { variant: 'error' }));
  }
}

// ─── online/offline awareness ──────────────────────────────────────────

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', () => {
    const cur = museStore.get();
    patch({ isOnline: true, status: cur.status === 'offline' ? 'idle' : cur.status });
  });
  window.addEventListener('offline', () => {
    patch({ isOnline: false, status: 'offline' });
  });
}

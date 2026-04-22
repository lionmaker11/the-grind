import { readdirSync } from 'fs';
import {
  readBacklog as readLocalBacklog,
  fetchRegistryLive,
  fetchBacklogLive,
  sortByPriority,
  nextTaskId
} from './_lib/vault.js';

const REPO = 'lionmaker11/the-grind';

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function ghRequest(path, method, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'the-grind-backlog'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, opts);
}

async function fetchBacklog(projectId) {
  const path = `vault/projects/${projectId}/backlog.json`;
  const resp = await ghRequest(path, 'GET');
  if (!resp.ok) return { backlog: null, sha: null, error: `Fetch failed ${resp.status}` };
  const data = await resp.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { backlog: JSON.parse(content), sha: data.sha, error: null };
}

async function writeBacklog(projectId, backlog, sha, commitMessage) {
  const path = `vault/projects/${projectId}/backlog.json`;
  const content = Buffer.from(JSON.stringify(backlog, null, 2) + '\n').toString('base64');
  const body = {
    message: commitMessage,
    content,
    ...(sha ? { sha } : {})
  };
  const resp = await ghRequest(path, 'PUT', body);
  if (resp.ok) {
    const data = await resp.json();
    return { ok: true, sha: data.content?.sha };
  }
  const err = await resp.text();
  return { ok: false, status: resp.status, error: err };
}

async function touchRegistry(projectId) {
  const path = 'vault/projects/_registry.json';
  try {
    const resp = await ghRequest(path, 'GET');
    if (!resp.ok) return;
    const data = await resp.json();
    const registry = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    const proj = (registry.projects || []).find(p => p.id === projectId);
    if (!proj) return;
    proj.last_touched = today();
    const updatedContent = Buffer.from(JSON.stringify(registry, null, 2) + '\n').toString('base64');
    await ghRequest(path, 'PUT', {
      message: `registry: touch ${projectId}`,
      content: updatedContent,
      sha: data.sha
    });
  } catch (e) {
    console.error('last_touched update failed:', e.message);
  }
}

// Insert task into sorted tasks array so that the array remains sorted by
// priority ascending. New task sits AFTER existing tasks of the same priority
// (stable insert).
function insertSorted(tasks, newTask) {
  const result = [...tasks];
  let idx = result.length;
  for (let i = 0; i < result.length; i++) {
    const p = result[i].priority == null ? 99 : result[i].priority;
    if (p > newTask.priority) {
      idx = i;
      break;
    }
  }
  result.splice(idx, 0, newTask);
  return result;
}

// Assign priorities 1..5 evenly across the reordered array.
// ≤5 tasks: assign by position (1-based). >5 tasks: bucket into 5 groups.
function assignBucketedPriorities(tasks) {
  const n = tasks.length;
  if (n === 0) return tasks;
  return tasks.map((t, i) => {
    let priority;
    if (n <= 5) {
      priority = i + 1;
    } else {
      // bucket: 0-indexed bucket = floor(i * 5 / n), +1 for 1-based
      priority = Math.floor((i * 5) / n) + 1;
    }
    return { ...t, priority };
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Chief-Token');
    return res.status(200).end();
  }

  const token = req.headers['x-chief-token'];
  if (token !== process.env.CHIEF_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const projectId = req.query?.project_id;
    res.setHeader('Cache-Control', 'no-cache, no-store');

    if (projectId) {
      const backlog = await fetchBacklogLive(projectId);
      if (!backlog) return res.status(404).json({ error: `Unknown project: ${projectId}` });
      return res.status(200).json({ backlog });
    }

    // No project_id → summary of all active + lightweight projects.
    // Live read from GitHub so writes from /api/backlog POST are visible
    // immediately rather than on next deploy.
    const registry = await fetchRegistryLive();
    const entries = registry?.projects || [];
    const active = entries.filter(p => p.status === 'active' || p.status === 'lightweight');

    const rows = await Promise.all(active.map(async (p) => {
      const bl = await fetchBacklogLive(p.id);
      if (!bl) return null;
      const pending = sortByPriority((bl.tasks || []).filter(t => t.status !== 'done'));
      return {
        project_id: p.id,
        project_name: bl.project_name || p.name,
        priority: p.priority,
        task_count: (bl.tasks || []).length,
        last_touched: p.last_touched || null,
        top: pending.slice(0, 3).map(t => ({ id: t.id, text: t.text, priority: t.priority }))
      };
    }));
    const summary = rows.filter(Boolean);

    // Orphan-folder recovery — folders under /vault/projects with no
    // registry entry. Stays on the local bundle: listing orphans needs
    // a dir walk, which would cost an extra GitHub tree call per GET
    // for a rare recovery case. If the bundle is stale, a missed orphan
    // resolves on next deploy.
    try {
      const projectsDir = new URL('../vault/projects', import.meta.url).pathname;
      const folders = readdirSync(projectsDir, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);
      for (const folder of folders) {
        if (summary.find(s => s.project_id === folder)) continue;
        const bl = readLocalBacklog(folder);
        if (!bl) continue;
        const pending = sortByPriority((bl.tasks || []).filter(t => t.status !== 'done'));
        summary.push({
          project_id: folder,
          project_name: bl.project_name || folder,
          priority: 999,
          task_count: (bl.tasks || []).length,
          last_touched: null,
          top: pending.slice(0, 3).map(t => ({ id: t.id, text: t.text, priority: t.priority })),
          unregistered: true
        });
      }
    } catch {}

    summary.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    return res.status(200).json({ summary });
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { op, project_id, task, task_id, priority, order, count, urgent } = req.body || {};

  if (!op || !project_id) return res.status(400).json({ error: 'Missing op or project_id' });

  // op: load is read-only — uses the live read path so Muse sees tasks
  // she just filed earlier in the same conversation.
  if (op === 'load') {
    const backlog = await fetchBacklogLive(project_id);
    if (!backlog) return res.status(404).json({ error: `Unknown project: ${project_id}` });
    const n = Math.max(1, Math.min(10, parseInt(count, 10) || 3));
    const pending = sortByPriority((backlog.tasks || []).filter(t => t.status !== 'done'));
    return res.status(200).json({
      ok: true,
      project_name: backlog.project_name || project_id,
      tasks: pending.slice(0, n)
    });
  }

  // All mutating ops need GitHub fetch
  const { backlog, sha, error } = await fetchBacklog(project_id);
  if (!backlog) return res.status(404).json({ error: error || 'Backlog not found' });
  backlog.tasks = Array.isArray(backlog.tasks) ? backlog.tasks : [];

  // ── add ──────────────────────────────────────────────────────────────────
  if (op === 'add') {
    if (!task || !task.text) return res.status(400).json({ error: 'Missing task.text' });
    if (!task.priority) return res.status(400).json({ error: 'Missing task.priority' });
    const pri = parseInt(task.priority, 10);
    if (!Number.isInteger(pri) || pri < 1 || pri > 5) {
      return res.status(400).json({ error: 'priority must be an integer 1–5' });
    }
    const newTask = {
      id: nextTaskId(project_id, backlog.tasks),
      text: String(task.text).slice(0, 200),
      done_condition: task.done_condition || null,
      category: task.category || null,
      estimated_pomodoros: task.estimated_pomodoros != null ? task.estimated_pomodoros : null,
      priority: pri,
      status: 'pending',
      created: today()
    };
    backlog.tasks = insertSorted(backlog.tasks, newTask);
    const msg = `backlog: add "${newTask.text.slice(0, 60)}" to ${project_id}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true, task: newTask });
  }

  // ── remove ───────────────────────────────────────────────────────────────
  if (op === 'remove') {
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });
    const before = backlog.tasks.length;
    backlog.tasks = backlog.tasks.filter(t => t.id !== task_id);
    if (backlog.tasks.length === before) {
      return res.status(404).json({ error: `Task ${task_id} not found in ${project_id}` });
    }
    const msg = `backlog: remove ${task_id} from ${project_id}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true });
  }

  // ── set_priority ─────────────────────────────────────────────────────────
  if (op === 'set_priority') {
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });
    const pri = parseInt(priority, 10);
    if (!Number.isInteger(pri) || pri < 1 || pri > 5) {
      return res.status(400).json({ error: 'priority must be an integer 1–5' });
    }
    const taskObj = backlog.tasks.find(t => t.id === task_id);
    if (!taskObj) return res.status(404).json({ error: `Task ${task_id} not found in ${project_id}` });
    taskObj.priority = pri;
    backlog.tasks = sortByPriority(backlog.tasks);
    const msg = `backlog: ${task_id} priority → P${pri}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true, task: taskObj });
  }

  // ── toggle_urgent ────────────────────────────────────────────────────────
  // Flip the binary urgent flag on a single task. Frontend passes the
  // desired state explicitly (not a flip-current), so retries are idempotent.
  // Pre-rebuild tasks without an `urgent` field are treated as urgent:false
  // on read; this op writes the field explicitly. No backfill required.
  if (op === 'toggle_urgent') {
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });
    if (typeof urgent !== 'boolean') return res.status(400).json({ error: 'urgent must be a boolean' });
    const taskObj = backlog.tasks.find(t => t.id === task_id);
    if (!taskObj) return res.status(404).json({ error: `Task ${task_id} not found in ${project_id}` });
    taskObj.urgent = urgent;
    const msg = `backlog: ${task_id} urgent → ${urgent ? 'on' : 'off'}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true, task: taskObj });
  }

  // ── complete ─────────────────────────────────────────────────────────────
  if (op === 'complete') {
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });
    const taskObj = backlog.tasks.find(t => t.id === task_id);
    if (!taskObj) return res.status(404).json({ error: `Task ${task_id} not found in ${project_id}` });
    // Recurring tasks stay pending; we just stamp last_completed so the UI can
    // mark "done today" and reset with the next calendar day.
    if (taskObj.recurring === 'daily') {
      taskObj.last_completed = today();
      taskObj.status = 'pending';
    } else {
      taskObj.status = 'done';
      taskObj.completed = today();
    }
    const msg = `backlog: complete ${task_id} in ${project_id}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true, task: taskObj });
  }

  // ── reorder ───────────────────────────────────────────────────────────────
  if (op === 'reorder') {
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Missing order array' });
    const byId = new Map(backlog.tasks.map(t => [t.id, t]));
    const reordered = [];
    for (const id of order) {
      if (byId.has(id)) {
        reordered.push(byId.get(id));
        byId.delete(id);
      }
    }
    // Append remaining tasks preserving original relative order
    for (const t of backlog.tasks) {
      if (byId.has(t.id)) reordered.push(t);
    }
    backlog.tasks = assignBucketedPriorities(reordered);
    const msg = `backlog: reorder ${project_id}`;
    const [result] = await Promise.all([
      writeBacklog(project_id, backlog, sha, msg),
      touchRegistry(project_id)
    ]);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: `Unknown op: ${op}` });
}

export const config = { maxDuration: 30 };

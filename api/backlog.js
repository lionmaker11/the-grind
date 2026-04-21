import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const REPO = 'lionmaker11/the-grind';
const REGISTRY_PATH = 'vault/projects/_registry.json';

const ID_PREFIX = {
  'the-grind': 'tg',
  'lionmaker-systems': 'ls',
  'alex-buildium': 'ab',
  'fast-track-uig': 'uig',
  'lionmaker-kettlebell': 'kb',
  'grillahq': 'gh',
  '708-pallister': 'pal',
  'motor-city-deals': 'mcd',
  'va-disability': 'va'
};

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

function nextTaskId(projectId, tasks) {
  const prefix = ID_PREFIX[projectId] || projectId.slice(0, 3);
  let max = 0;
  for (const t of tasks || []) {
    const m = String(t.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function readLocalBacklog(projectId) {
  const path = join(process.cwd(), 'vault', 'projects', projectId, 'backlog.json');
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

function readLocalRegistry() {
  const path = join(process.cwd(), REGISTRY_PATH);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
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

  if (req.method === 'GET') {
    const projectId = req.query?.project_id;
    if (projectId) {
      const backlog = readLocalBacklog(projectId);
      if (!backlog) return res.status(404).json({ error: `Unknown project: ${projectId}` });
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.status(200).json({ backlog });
    }
    // No project_id → return summary of all active project backlogs
    const registry = readLocalRegistry();
    const projectsDir = join(process.cwd(), 'vault', 'projects');
    const entries = registry?.projects || [];
    const summary = [];
    for (const p of entries) {
      if (p.status !== 'active' && p.status !== 'lightweight') continue;
      const bl = readLocalBacklog(p.id);
      if (!bl) continue;
      summary.push({
        project_id: p.id,
        project_name: bl.project_name || p.name,
        priority: p.priority,
        task_count: (bl.tasks || []).length,
        top: (bl.tasks || []).slice(0, 3).map(t => ({ id: t.id, text: t.text }))
      });
    }
    // Also include any projects on disk not in registry (don't lose data)
    try {
      const folders = readdirSync(projectsDir, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);
      for (const folder of folders) {
        if (summary.find(s => s.project_id === folder)) continue;
        const bl = readLocalBacklog(folder);
        if (!bl) continue;
        summary.push({
          project_id: folder,
          project_name: bl.project_name || folder,
          priority: 999,
          task_count: (bl.tasks || []).length,
          top: (bl.tasks || []).slice(0, 3).map(t => ({ id: t.id, text: t.text })),
          unregistered: true
        });
      }
    } catch {}
    summary.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ summary });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { op, project_id, task, task_id, order, count } = req.body || {};
  if (!op || !project_id) return res.status(400).json({ error: 'Missing op or project_id' });

  const { backlog, sha, error } = await fetchBacklog(project_id);
  if (!backlog) return res.status(404).json({ error: error || 'Backlog not found' });
  backlog.tasks = Array.isArray(backlog.tasks) ? backlog.tasks : [];

  if (op === 'add') {
    if (!task || !task.text) return res.status(400).json({ error: 'Missing task.text' });
    const newTask = {
      id: task.id || nextTaskId(project_id, backlog.tasks),
      text: String(task.text).slice(0, 200),
      done_condition: task.done_condition || null,
      category: task.category || null,
      estimated_pomodoros: typeof task.estimated_pomodoros === 'number' ? task.estimated_pomodoros : null,
      priority: (backlog.tasks.length ? Math.max(...backlog.tasks.map(t => t.priority || 0)) : 0) + 1,
      status: 'pending',
      created: new Date().toISOString().slice(0, 10)
    };
    backlog.tasks.push(newTask);
    const result = await writeBacklog(project_id, backlog, sha, `backlog: add "${newTask.text.slice(0, 60)}" to ${project_id}`);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true, task: newTask });
  }

  if (op === 'remove') {
    if (!task_id) return res.status(400).json({ error: 'Missing task_id' });
    const before = backlog.tasks.length;
    backlog.tasks = backlog.tasks.filter(t => t.id !== task_id);
    if (backlog.tasks.length === before) return res.status(404).json({ error: `Task ${task_id} not in ${project_id} backlog` });
    const result = await writeBacklog(project_id, backlog, sha, `backlog: remove ${task_id} from ${project_id}`);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true });
  }

  if (op === 'reorder') {
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Missing order' });
    const byId = new Map(backlog.tasks.map(t => [t.id, t]));
    const reordered = [];
    order.forEach((id, i) => { if (byId.has(id)) { const t = byId.get(id); t.priority = i + 1; reordered.push(t); byId.delete(id); } });
    byId.forEach(t => reordered.push(t));
    backlog.tasks = reordered;
    const result = await writeBacklog(project_id, backlog, sha, `backlog: reorder ${project_id}`);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ ok: true });
  }

  if (op === 'load') {
    const n = Math.max(1, Math.min(10, parseInt(count, 10) || 3));
    const pending = backlog.tasks.filter(t => t.status !== 'done').slice(0, n);
    return res.status(200).json({ ok: true, project_name: backlog.project_name || project_id, tasks: pending });
  }

  return res.status(400).json({ error: `Unknown op: ${op}` });
}

export const config = { maxDuration: 30 };

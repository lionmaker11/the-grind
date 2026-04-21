import { readRegistry } from './_lib/vault.js';

const REPO = 'lionmaker11/the-grind';

async function ghRequest(path, method, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'the-grind-project'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, opts);
}

function todayDetroit() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit' }).format(new Date());
}

function makeId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function fetchFile(filePath) {
  const resp = await ghRequest(filePath, 'GET');
  if (!resp.ok) return { content: null, sha: null, status: resp.status };
  const data = await resp.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content: JSON.parse(content), sha: data.sha, status: 200 };
}

async function putFile(filePath, payload, sha, message) {
  const content = Buffer.from(JSON.stringify(payload, null, 2) + '\n').toString('base64');
  const body = { message, content, ...(sha ? { sha } : {}) };
  const resp = await ghRequest(filePath, 'PUT', body);
  if (resp.ok) {
    const data = await resp.json();
    return { ok: true, sha: data.content?.sha };
  }
  // On 409 conflict, retry once with a fresh SHA
  if (resp.status === 409) {
    const fresh = await ghRequest(filePath, 'GET');
    if (!fresh.ok) return { ok: false, status: resp.status, error: 'Conflict and re-fetch failed' };
    const freshData = await fresh.json();
    const body2 = { message, content, sha: freshData.sha };
    const resp2 = await ghRequest(filePath, 'PUT', body2);
    if (resp2.ok) {
      const data2 = await resp2.json();
      return { ok: true, sha: data2.content?.sha };
    }
    const err2 = await resp2.text();
    return { ok: false, status: resp2.status, error: err2 };
  }
  const err = await resp.text();
  return { ok: false, status: resp.status, error: err };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Chief-Token');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-chief-token'];
  if (token !== process.env.CHIEF_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { op, name, project_id, priority, aliases, note } = req.body || {};
  if (!op) return res.status(400).json({ error: 'Missing op' });

  const REGISTRY_PATH = 'vault/projects/_registry.json';

  // ── add ────────────────────────────────────────────────────────────────────
  if (op === 'add') {
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Missing name' });

    const id = makeId(String(name).trim());

    // Read registry from GitHub (authoritative for writes)
    const { content: registry, sha: regSha } = await fetchFile(REGISTRY_PATH);
    if (!registry) return res.status(500).json({ error: 'Could not load registry' });

    const projects = Array.isArray(registry.projects) ? registry.projects : [];

    if (projects.find(p => p.id === id)) {
      return res.status(409).json({ error: `Project id "${id}" already exists` });
    }

    const maxPriority = projects.reduce((m, p) => Math.max(m, p.priority || 0), 0);
    const resolvedPriority = typeof priority === 'number' ? priority : maxPriority + 1;

    const entry = {
      id,
      name: String(name).trim(),
      status: 'active',
      priority: resolvedPriority,
      folder: `vault/projects/${id}`,
      aliases: Array.isArray(aliases) ? aliases : [],
      ...(note != null ? { note: String(note) } : {})
    };

    const updatedRegistry = {
      ...registry,
      updated: todayDetroit(),
      projects: [...projects, entry]
    };

    const backlogPayload = {
      schema_version: 1,
      project_id: id,
      project_name: entry.name,
      tasks: []
    };
    const backlogPath = `vault/projects/${id}/backlog.json`;

    // Write registry and new backlog.json in parallel
    const [regResult, backlogResult] = await Promise.all([
      putFile(REGISTRY_PATH, updatedRegistry, regSha, `registry: add project ${id}`),
      putFile(backlogPath, backlogPayload, null, `backlog: create ${id}`)
    ]);

    if (!regResult.ok) return res.status(regResult.status || 500).json({ error: regResult.error });
    if (!backlogResult.ok) return res.status(backlogResult.status || 500).json({ error: backlogResult.error });

    return res.status(200).json({ ok: true, project: entry });
  }

  // ── archive ────────────────────────────────────────────────────────────────
  if (op === 'archive') {
    if (!project_id) return res.status(400).json({ error: 'Missing project_id' });

    const { content: registry, sha: regSha } = await fetchFile(REGISTRY_PATH);
    if (!registry) return res.status(500).json({ error: 'Could not load registry' });

    const projects = Array.isArray(registry.projects) ? registry.projects : [];
    const idx = projects.findIndex(p => p.id === project_id);
    if (idx === -1) return res.status(404).json({ error: `Unknown project: ${project_id}` });

    projects[idx] = { ...projects[idx], status: 'inactive' };
    const updatedRegistry = { ...registry, updated: todayDetroit(), projects };

    const result = await putFile(REGISTRY_PATH, updatedRegistry, regSha, `registry: archive ${project_id}`);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });

    return res.status(200).json({ ok: true });
  }

  // ── activate ───────────────────────────────────────────────────────────────
  if (op === 'activate') {
    if (!project_id) return res.status(400).json({ error: 'Missing project_id' });

    const { content: registry, sha: regSha } = await fetchFile(REGISTRY_PATH);
    if (!registry) return res.status(500).json({ error: 'Could not load registry' });

    const projects = Array.isArray(registry.projects) ? registry.projects : [];
    const idx = projects.findIndex(p => p.id === project_id);
    if (idx === -1) return res.status(404).json({ error: `Unknown project: ${project_id}` });

    projects[idx] = { ...projects[idx], status: 'active' };
    const updatedRegistry = { ...registry, updated: todayDetroit(), projects };

    const result = await putFile(REGISTRY_PATH, updatedRegistry, regSha, `registry: activate ${project_id}`);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: `Unknown op: ${op}` });
}

export const config = { maxDuration: 30 };

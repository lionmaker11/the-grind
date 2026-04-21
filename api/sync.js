const REPO = 'lionmaker11/the-grind';

async function ghRequest(path, method, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'the-grind-sync'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, opts);
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

  const { type, payload } = req.body;

  if (type === 'results') {
    // Write results/{date}.json
    const date = payload?.date;
    if (!date) return res.status(400).json({ error: 'Missing date' });

    const filePath = `results/${date}.json`;
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

    // Check if file exists (get SHA for update)
    let sha = null;
    try {
      const existing = await ghRequest(filePath, 'GET');
      if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
      }
    } catch {}

    const body = {
      message: `results: ${date} sync`,
      content,
      ...(sha ? { sha } : {})
    };

    const resp = await ghRequest(filePath, 'PUT', body);
    if (resp.ok) {
      const data = await resp.json();
      return res.status(200).json({ ok: true, sha: data.content?.sha });
    }
    const err = await resp.text();
    return res.status(resp.status).json({ ok: false, error: err });
  }

  if (type === 'conversation_append') {
    // Append one or more JSONL lines to vault/conversations/{date}.jsonl.
    // payload = { date: "YYYY-MM-DD", lines: [{ts, role, content, ...}, ...] }
    const date = payload?.date;
    const lines = Array.isArray(payload?.lines) ? payload.lines : null;
    if (!date || !lines?.length) return res.status(400).json({ error: 'Missing date or lines' });

    const filePath = `vault/conversations/${date}.jsonl`;
    const nowIso = new Date().toISOString();

    // Validate + normalize each line; cap to what one request can reasonably
    // append (defensive against a runaway client).
    const safe = lines.slice(0, 20).map(l => ({
      ts: typeof l.ts === 'string' ? l.ts : nowIso,
      role: l.role === 'user' || l.role === 'assistant' ? l.role : 'user',
      content: typeof l.content === 'string' ? l.content.slice(0, 4000) : ''
    })).filter(l => l.content);
    if (!safe.length) return res.status(400).json({ error: 'No valid lines' });

    // GET → append → PUT with SHA. If file doesn't exist, create it.
    let sha = null;
    let existing = '';
    try {
      const r = await ghRequest(filePath, 'GET');
      if (r.ok) {
        const data = await r.json();
        sha = data.sha;
        existing = Buffer.from(data.content, 'base64').toString('utf-8');
        if (existing && !existing.endsWith('\n')) existing += '\n';
      }
    } catch {}

    const appended = existing + safe.map(l => JSON.stringify(l)).join('\n') + '\n';
    const content = Buffer.from(appended).toString('base64');

    const body = {
      message: `conversations: ${date} +${safe.length}`,
      content,
      ...(sha ? { sha } : {})
    };

    const resp = await ghRequest(filePath, 'PUT', body);
    if (resp.ok) {
      const data = await resp.json();
      return res.status(200).json({ ok: true, sha: data.content?.sha, appended: safe.length });
    }
    const err = await resp.text();
    return res.status(resp.status).json({ ok: false, error: err });
  }

  if (type === 'update_today') {
    // Update today.json with modified queue state
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

    let sha = null;
    try {
      const existing = await ghRequest('today.json', 'GET');
      if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
      }
    } catch {}

    const body = {
      message: 'grind: queue update via in-app Chief',
      content,
      ...(sha ? { sha } : {})
    };

    const resp = await ghRequest('today.json', 'PUT', body);
    if (resp.ok) {
      const data = await resp.json();
      return res.status(200).json({ ok: true, sha: data.content?.sha });
    }
    const err = await resp.text();
    return res.status(resp.status).json({ ok: false, error: err });
  }

  return res.status(400).json({ error: 'Invalid sync type. Use "results" or "update_today".' });
}

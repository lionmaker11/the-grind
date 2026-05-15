// Single fetch wrapper for /api/* backend calls. Adds the X-Chief-Token
// auth header on every request. GETs retry twice with exponential backoff
// (300ms, 600ms). POSTs surface errors immediately — mutations must not
// retry silently.

const TOKEN = import.meta.env.VITE_CHIEF_AUTH_TOKEN;

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (TOKEN) h['X-Chief-Token'] = TOKEN;
  return h;
}

async function getJson(url, { retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = 300 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function postJson(url, payload) {
  const headers = authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let msg = '';
    try {
      const j = await res.json();
      // Concatenate error + details so the Muse error bubble carries the
      // upstream provider message (e.g. Groq's rejection reason on Safari).
      if (j.error && j.details) msg = `${j.error}: ${j.details}`;
      else msg = j.error || j.details || '';
    } catch {
      // body not JSON — ignore
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── board reads ───────────────────────────────────────────────────────

export const getBacklog = () => getJson('/api/backlog');

// Fetch a single project's full backlog (used by Phase 5b backlog detail
// modal). Returns { backlog: { schema_version, project_id, project_name,
// tasks: [...] } } on success; throws on 404 or transport error. Distinct
// from getBacklog() which returns the multi-project summary used by Board.
export const getProjectBacklog = (projectId) =>
  getJson(`/api/backlog?project_id=${encodeURIComponent(projectId)}`);

// ─── muse ──────────────────────────────────────────────────────────────

export function postChief({ message, conversation = [], firstTurnToday = false, mode = 'muse' }) {
  return postJson('/api/chief', { message, conversation, firstTurnToday, mode });
}

async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Chunked to avoid argument-length limits on large audio
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export async function postTranscribe(blob) {
  // Safari can produce a zero- or near-zero-byte blob if the user taps
  // stop within a few hundred ms. Surface a clear error instead of paying
  // a round-trip that Groq will reject with a cryptic message.
  if (!blob || blob.size < 200) {
    throw new Error('recording too short — hold the mic and speak');
  }
  const audio = await blobToBase64(blob);
  const res = await postJson('/api/transcribe', { audio, mimeType: blob.type || 'audio/webm' });
  return res.text || '';
}

// ─── tool-call dispatch targets ────────────────────────────────────────

export const backlogOp = (payload) => postJson('/api/backlog', payload);
export const projectOp = (payload) => postJson('/api/project', payload);

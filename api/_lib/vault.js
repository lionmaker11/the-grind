// Shared vault helpers. Used by api/chief.js, api/backlog.js, api/project.js.
// Files prefixed with "_" are not routed by Vercel, so this file is safe to
// place under /api/.
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const REGISTRY_REL = join('vault', 'projects', '_registry.json');
const MUSE_SYSTEM_REL = join('vault', 'systems', 'muse-system.md');
const ONBOARD_SYSTEM_REL = join('vault', 'systems', 'onboard-system.md');

export const ID_PREFIX = {
  'the-grind': 'tg',
  'lionmaker-systems': 'ls',
  'alex-buildium': 'ab',
  'fast-track-uig': 'uig',
  'lionmaker-kettlebell': 'kb',
  'grillahq': 'gh',
  '708-pallister': 'pal',
  'motor-city-deals': 'mcd',
  'va-disability': 'va',
  'marcus': 'mrc',
  'mcd-agent-org': 'mao',
  'biggerspreads': 'bs',
  'lionmaker': 'lm',
  'fitness': 'fit'
};

export function readRegistry() {
  const path = join(process.cwd(), REGISTRY_REL);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

export function readBacklog(projectId) {
  const path = join(process.cwd(), 'vault', 'projects', projectId, 'backlog.json');
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

export function readMuseSystem() {
  const path = join(process.cwd(), MUSE_SYSTEM_REL);
  if (!existsSync(path)) return null;
  try { return readFileSync(path, 'utf-8'); }
  catch { return null; }
}

export function readOnboardSystem() {
  const path = join(process.cwd(), ONBOARD_SYSTEM_REL);
  if (!existsSync(path)) return null;
  try { return readFileSync(path, 'utf-8'); }
  catch { return null; }
}

export function getActiveProjects(registry) {
  return ((registry?.projects) || [])
    .filter(p => p.status === 'active' || p.status === 'lightweight')
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getAllProjectIds(registry) {
  return ((registry?.projects) || []).map(p => p.id);
}

// Sort backlog tasks for display order. Urgent-flagged tasks float to the
// top (April 2026 simplification pass — `urgent` is the universal priority
// signal). Within each urgent grouping, sort by priority ascending (1 =
// highest); tasks without a priority sink to the bottom of their grouping.
// Stable within equal urgent+priority by preserving original array order.
//
// Boolean(t.urgent) coerces undefined / null / missing-field to false so
// legacy vault tasks (pre-simplification, no urgent field) sort as
// non-urgent without crashing.
//
// Function name kept as sortByPriority because all 6 call sites already
// import it and the urgent-first behavior is universal by design (see
// phase5a-spec.md Decision 3 and the per-call-site analysis in 5a-3
// reading: Board, Muse op:load, op:set_priority resort, and chief.js
// registry-tail context all want urgent-first).
export function sortByPriority(tasks) {
  return [...(tasks || [])]
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const ua = Boolean(a.t.urgent);
      const ub = Boolean(b.t.urgent);
      if (ua !== ub) return ua ? -1 : 1;
      const pa = a.t.priority == null ? 99 : a.t.priority;
      const pb = b.t.priority == null ? 99 : b.t.priority;
      if (pa !== pb) return pa - pb;
      return a.i - b.i;
    })
    .map(x => x.t);
}

export function getBacklogSummary({ topN = 3 } = {}) {
  const registry = readRegistry();
  const active = getActiveProjects(registry);
  const out = [];
  for (const p of active) {
    const bl = readBacklog(p.id);
    if (!bl) continue;
    const pending = sortByPriority((bl.tasks || []).filter(t => t.status !== 'done'));
    out.push({
      project_id: p.id,
      project_name: bl.project_name || p.name,
      project_priority: p.priority || 999,
      task_count: pending.length,
      tasks: pending.slice(0, topN)
    });
  }
  return out;
}

export function renderBacklogsText(summary) {
  if (!summary?.length) return '';
  const lines = ['### Project Backlogs (top pending, sorted by priority)'];
  for (const b of summary) {
    if (!b.tasks.length) {
      lines.push(`- ${b.project_name} [${b.project_id}] — empty`);
      continue;
    }
    lines.push(`- ${b.project_name} [${b.project_id}] (${b.task_count} pending):`);
    b.tasks.forEach(t => {
      const pri = t.priority == null ? '-' : `P${t.priority}`;
      lines.push(`    ${t.id} ${pri}: ${t.text}`);
    });
  }
  return lines.join('\n');
}

export function nextTaskId(projectId, tasks) {
  const prefix = ID_PREFIX[projectId] || projectId.slice(0, 3);
  let max = 0;
  for (const t of tasks || []) {
    const m = String(t.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

// Detroit local day-of-week (0 = Sun, 4 = Thu). Used by chief.js to decide
// whether to surface the biweekly priority-review prompt.
export function detroitDayOfWeek(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit', weekday: 'short'
  }).formatToParts(date);
  const wd = parts.find(p => p.type === 'weekday')?.value;
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? -1;
}

// ─── GitHub live reads ────────────────────────────────────────────────
// GET handlers must read from the same source the POST path writes to,
// otherwise read-after-write consistency is bounded by the Vercel deploy
// cycle (the bundled /vault/ is frozen at build time). Matches the
// ghRequest pattern in api/backlog.js and api/project.js write paths.

const GH_REPO = 'lionmaker11/the-grind';

async function ghGet(path) {
  const resp = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'the-grind-vault'
    }
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  try { return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')); }
  catch { return null; }
}

export async function fetchRegistryLive() {
  return ghGet('vault/projects/_registry.json');
}

export async function fetchBacklogLive(projectId) {
  return ghGet(`vault/projects/${projectId}/backlog.json`);
}

export async function getBacklogSummaryLive({ topN = 3 } = {}) {
  const registry = await fetchRegistryLive();
  const active = getActiveProjects(registry);
  const rows = await Promise.all(active.map(async (p) => {
    const bl = await fetchBacklogLive(p.id);
    if (!bl) return null;
    const pending = sortByPriority((bl.tasks || []).filter(t => t.status !== 'done'));
    return {
      project_id: p.id,
      project_name: bl.project_name || p.name,
      project_priority: p.priority || 999,
      task_count: pending.length,
      tasks: pending.slice(0, topN)
    };
  }));
  return rows.filter(Boolean);
}

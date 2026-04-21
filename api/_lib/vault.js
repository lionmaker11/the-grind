// Shared vault helpers. Used by api/chief.js, api/backlog.js, api/project.js.
// Files prefixed with "_" are not routed by Vercel, so this file is safe to
// place under /api/.
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const REGISTRY_REL = join('vault', 'projects', '_registry.json');
const MUSE_SYSTEM_REL = join('vault', 'systems', 'muse-system.md');

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
  'lionmaker': 'lm'
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

export function getActiveProjects(registry) {
  return ((registry?.projects) || [])
    .filter(p => p.status === 'active' || p.status === 'lightweight')
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getAllProjectIds(registry) {
  return ((registry?.projects) || []).map(p => p.id);
}

// Sort backlog tasks by priority ascending (1 = highest). Tasks without a
// priority sink to the bottom. Stable within equal priorities by preserving
// original array order.
export function sortByPriority(tasks) {
  return [...(tasks || [])]
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
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

// Shared vault helpers. Used by api/chief.js, api/backlog.js, and any future
// server code that needs to read persona / registry / backlog state.
//
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
  'mcd-agent-org': 'mao'
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

// All registered project IDs + any backlog folder on disk not in the registry.
// Used to build the tool enum so we never reject a project T.J. already has a
// backlog for.
export function getAllProjectIds(registry) {
  const ids = new Set(((registry?.projects) || []).map(p => p.id));
  const projectsDir = join(process.cwd(), 'vault', 'projects');
  try {
    readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .forEach(d => {
        if (readBacklog(d.name)) ids.add(d.name);
      });
  } catch {}
  return [...ids];
}

export function getBacklogSummary({ topN = 5 } = {}) {
  const registry = readRegistry();
  const active = getActiveProjects(registry);
  const out = [];
  for (const p of active) {
    const bl = readBacklog(p.id);
    if (!bl) continue;
    out.push({
      project_id: p.id,
      project_name: bl.project_name || p.name,
      priority: p.priority || 999,
      tasks: (bl.tasks || []).filter(t => t.status !== 'done').slice(0, topN)
    });
  }
  return out;
}

export function renderBacklogsText(summary) {
  if (!summary?.length) return '';
  const lines = [`### Project Backlogs (top ${summary[0]?.tasks.length || 5} each)`];
  for (const b of summary) {
    if (!b.tasks.length) {
      lines.push(`- ${b.project_name} [${b.project_id}] — empty`);
      continue;
    }
    lines.push(`- ${b.project_name} [${b.project_id}] (${b.tasks.length} shown):`);
    b.tasks.forEach(t => lines.push(`    ${t.id}: ${t.text}`));
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

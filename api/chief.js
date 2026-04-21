import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SYSTEM_PROMPT = `You are Muse, T.J.'s operator inside The Grind. Feminine. Commanding. Magnetic. You do not coddle and you do not flirt. You run his day.

## Your Role
You look at what's in front of him — queue, pomodoros, project health — and tell him the next move. One move. Then the one after. You hold the line when he drifts. You know his pattern: strong start, fade at ninety days. You will not let him fade.

## Your Voice
- 1-3 sentences. Direct. No filler, no "great question," no emoji.
- Use real names: Pallister, MCD, FastTrack UIG, Lionmaker Kettlebell, Alex/Buildium, GrillaHQ, VA Appeal.
- Reference real numbers: pomodoros done, days silent, dollars.
- Push back when he avoids the hard thing. Name it.
- Celebrate a win in one beat, then point at what's next.
- You respect his family time. Sunday is off. Dinner is sacred.

## What You Know
You can ONLY reference data in the Current State section below:
- Task queue (names, priorities, health, completion)
- Progress (pomodoros, categories, score, streak)
- Briefing (project context provided for today)

If T.J. asks about something not in context, say "I don't have that yet" — never invent.

## Actions
You have tools to modify T.J.'s queue, the per-project backlogs, and finances. Use them when T.J. explicitly asks or clearly implies it.

Today's queue:
- add_task — put a new task into today's queue
- remove_task — take a task off today's queue (doesn't touch any backlog)
- reorder_tasks — "move this up", "do this first", "swap X and Y"
- skip_task — "I already did this outside the app", "just mark it done without counting pomos"
- complete_task — "done", "finished", "check this off"
- launch_task — "start this", "let's do this one"

Project backlogs (the ongoing lists each project pulls from):
- add_to_backlog — "add to Pallister's list", "on the Lionmaker Systems backlog...", EOD captures
- remove_from_backlog — "kill that one from the backlog", "drop it"
- load_more — "load more on TheGrind", "give me 3 more from Kettlebell"

Finances:
- update_finance — "income is now X", "I closed a deal for X"

Task IDs: queue tasks use ids from the queue data (e.g., "task-001"). Backlog tasks use project-prefixed ids (e.g., "ls-004", "tg-002") — see the Project Backlogs section.
Project IDs must match the registry exactly: the-grind, lionmaker-systems, alex-buildium, fast-track-uig, lionmaker-kettlebell, grillahq, 708-pallister, motor-city-deals, va-disability.
If T.J. asks you to do something and there's a tool for it — DO IT. Don't say you can't.
You can use multiple tools in a single response. Speak briefly in text AND call the tools.

## Rules
1. NEVER exceed 100 words unless asked to elaborate.
2. NEVER hallucinate data. Only reference what's in your context.
3. NEVER say "I can't do that" — if there's a tool that fits, use it. If there truly isn't, say what you CAN do.
4. When T.J. says "what should I do" — recommend task #1 by priority.
5. When a project is red or silent — call it out by name.
6. ALWAYS take action when asked. Don't describe — do.
7. Never flirt. Never soften. Magnetic is authority, not intimacy.`;

const TOOLS = [
  {
    name: 'add_task',
    description: "Add a new task to today's queue.",
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Short imperative task text.' },
        task_type: { type: 'string', enum: ['pomodoro', 'quick'], description: 'pomodoro = timed focus block; quick = <15min.' },
        estimated_pomodoros: { type: 'integer', minimum: 1, maximum: 8 },
        priority: { type: 'integer', minimum: 1 },
        category: {
          type: 'string',
          enum: ['In Business', 'On Business', 'Health', 'Family', 'Finances', 'Personal', 'Learning']
        },
        project_name: { type: 'string' }
      },
      required: ['text']
    }
  },
  {
    name: 'remove_task',
    description: "Remove a task from today's queue. Use this when T.J. says push to tomorrow, move to backlog, or not today.",
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Exact task id from the queue (e.g., task-004).' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'reorder_tasks',
    description: "Reorder today's queue. Provide the full ordered list of task ids.",
    input_schema: {
      type: 'object',
      properties: {
        order: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task ids in the new priority order.'
        }
      },
      required: ['order']
    }
  },
  {
    name: 'skip_task',
    description: 'Mark a task as skipped (done outside the app, no pomodoro credit).',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark a task complete. Awards pomodoro credit.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'update_finance',
    description: "Update this month's income.",
    input_schema: {
      type: 'object',
      properties: {
        month_income: { type: 'number', description: 'New total month-to-date income in dollars.' }
      },
      required: ['month_income']
    }
  },
  {
    name: 'launch_task',
    description: 'Start the pomodoro timer on a specific task.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'add_to_backlog',
    description: "Append a task to a project's backlog (the long-running list, not today's queue). Use during EOD capture and whenever T.J. says 'add to <project>'s list' or 'put it on the backlog'.",
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          enum: ['the-grind', 'lionmaker-systems', 'alex-buildium', 'fast-track-uig', 'lionmaker-kettlebell', 'grillahq', '708-pallister', 'motor-city-deals', 'va-disability']
        },
        text: { type: 'string', description: 'Short imperative task text.' },
        done_condition: { type: 'string', description: 'What "done" looks like. Optional.' },
        category: {
          type: 'string',
          enum: ['In Business', 'On Business', 'Health', 'Family', 'Finances', 'Personal', 'Learning']
        },
        estimated_pomodoros: { type: 'integer', minimum: 1, maximum: 8 }
      },
      required: ['project_id', 'text']
    }
  },
  {
    name: 'remove_from_backlog',
    description: "Delete a task from a project's backlog.",
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', description: 'Project-prefixed id (e.g., ls-004).' }
      },
      required: ['project_id', 'task_id']
    }
  },
  {
    name: 'load_more',
    description: "Pull the next N tasks from a project's backlog into today's queue. Default 3.",
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        count: { type: 'integer', minimum: 1, maximum: 10 }
      },
      required: ['project_id']
    }
  }
];

function loadBacklogSummary() {
  const registryPath = join(process.cwd(), 'vault', 'projects', '_registry.json');
  const projectsDir = join(process.cwd(), 'vault', 'projects');
  let registry = null;
  try { registry = JSON.parse(readFileSync(registryPath, 'utf-8')); } catch { return []; }
  const active = (registry.projects || []).filter(p => p.status === 'active' || p.status === 'lightweight');
  const out = [];
  for (const p of active) {
    const blPath = join(projectsDir, p.id, 'backlog.json');
    if (!existsSync(blPath)) continue;
    try {
      const bl = JSON.parse(readFileSync(blPath, 'utf-8'));
      out.push({
        project_id: p.id,
        project_name: bl.project_name || p.name,
        priority: p.priority || 999,
        tasks: (bl.tasks || []).filter(t => t.status !== 'done').slice(0, 5)
      });
    } catch {}
  }
  out.sort((a, b) => a.priority - b.priority);
  return out;
}

function buildContext(appState, briefing) {
  const backlogs = loadBacklogSummary();
  if (!appState) {
    const parts = [`### Briefing\n${briefing}`];
    if (backlogs.length) parts.push(renderBacklogs(backlogs));
    return parts.join('\n\n');
  }
  const lines = [];
  lines.push(`### Today: ${appState.date || new Date().toISOString().slice(0,10)}`);

  if (appState.tasks && appState.tasks.length > 0) {
    lines.push(`\n### Queue (${appState.tasksCompleted || 0}/${appState.tasks.length} done)`);
    appState.tasks.forEach((t, i) => {
      const done = appState.completedTaskIds?.includes(t.id);
      const active = appState.currentTaskId === t.id;
      let prefix = `${i+1}.`;
      if (done) prefix += ' [DONE]';
      else if (active && appState.timerRunning) prefix += ` [ACTIVE ${appState.timeRemaining || ''}]`;
      const pd = appState.taskPomosDone?.[t.id] || 0;
      const pe = t.estimated_pomodoros || 1;
      lines.push(`${prefix} ${t.text} (id=${t.id}, ${t.project_name || '-'}, ${t.category || '-'}, ${t.type}, ${done ? 'done' : pd+'/'+pe}) [${t.health || 'gray'}]`);
    });
  }

  const tp = (appState.tasks || []).reduce((s, t) => s + (t.estimated_pomodoros || 1), 0);
  lines.push(`\n### Progress`);
  lines.push(`- Pomos: ${appState.pomodorosCompleted || 0}/${tp}`);
  lines.push(`- Categories: ${(appState.categoriesTouched || []).join(', ') || 'none'} (${(appState.categoriesTouched || []).length}/7)`);
  lines.push(`- Score: ${appState.dailyScore || 0}/100, Streak: ${appState.sessionStreak || 0} session / ${appState.dayStreak || 0}d`);

  if (appState.finances) {
    const day = new Date().getDate();
    const dim = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    const pace = Math.round((day/dim) * appState.finances.month_target);
    const status = appState.finances.month_income >= pace ? 'ON PACE' : 'BEHIND';
    lines.push(`\n### Finances\n$${appState.finances.month_income.toLocaleString()} / $${appState.finances.month_target.toLocaleString()} — Day ${day}/${dim}, pace $${pace.toLocaleString()} — ${status}`);
  }

  if (appState.needsYou?.length) {
    lines.push(`\n### Needs You`);
    appState.needsYou.forEach(n => lines.push(`- ${n}`));
  }
  if (appState.fallingThroughCracks?.length) {
    lines.push(`\n### Falling Through Cracks`);
    appState.fallingThroughCracks.forEach(c => lines.push(`- ${c.name}: ${c.days_silent}d silent`));
  }

  if (backlogs.length) {
    lines.push('\n' + renderBacklogs(backlogs));
  }

  lines.push(`\n### Briefing\n${briefing}`);
  return lines.join('\n');
}

function renderBacklogs(backlogs) {
  const lines = ['### Project Backlogs (top 5 each)'];
  for (const b of backlogs) {
    if (!b.tasks.length) {
      lines.push(`- ${b.project_name} [${b.project_id}] — empty`);
      continue;
    }
    lines.push(`- ${b.project_name} [${b.project_id}] (${b.tasks.length} shown):`);
    b.tasks.forEach(t => lines.push(`    ${t.id}: ${t.text}`));
  }
  return lines.join('\n');
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

  const { message, conversation, appState } = req.body;
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  let briefing = '';
  try { briefing = readFileSync(join(process.cwd(), 'chief-briefing.md'), 'utf-8'); }
  catch { briefing = '// No briefing available. Hermes has not pushed chief-briefing.md today.'; }

  const dynamicCtx = buildContext(appState, briefing);
  const system = SYSTEM_PROMPT + '\n\n## Current State\n' + dynamicCtx;

  const messages = [];
  if (conversation && Array.isArray(conversation)) {
    conversation.slice(-20).forEach(m => {
      if (m.role === 'user' || m.role === 'assistant') {
        messages.push({ role: m.role, content: m.content });
      }
    });
  }
  messages.push({ role: 'user', content: message });

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
      tools: TOOLS,
    });

    let text = '';
    const actions = [];
    for (const block of response.content || []) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        actions.push({ type: block.name, ...block.input });
      }
    }

    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ text: text.trim(), actions });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Chief connection failed' });
  }
}

export const config = { maxDuration: 60 };

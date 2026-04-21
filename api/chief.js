import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  readRegistry,
  readMuseSystem,
  getAllProjectIds,
  getBacklogSummary,
  renderBacklogsText
} from './_lib/vault.js';

// Fallback persona — used only if vault/systems/muse-system.md is unreadable.
// Kept minimal; the canonical voice lives in the vault file.
const FALLBACK_PERSONA = `You are Muse, T.J.'s operator inside The Grind. Feminine. Commanding. Magnetic. You do not coddle and you do not flirt. You run his day. 1–3 sentences. Direct. No filler. Never invent data.`;

// App-specific prompt section — tool documentation, current-state reference,
// and chat-surface rules. This lives in chief.js because it's bound to this
// endpoint's tools; persona / guardrails live in muse-system.md.
const APP_CONTEXT_PROMPT = `## What You Know Here
You can ONLY reference data in the Current State section below:
- Task queue (names, priorities, health, completion)
- Progress (pomodoros, categories, score, streak)
- Briefing (project context provided for today)
- Project Backlogs (top 5 pending tasks per active project)

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

Task IDs: queue tasks use ids from the queue data (e.g., "task-001"). Backlog tasks use project-prefixed ids (e.g., "ls-004", "tg-002") — see the Project Backlogs section. Project IDs must match the registry exactly.
If T.J. asks you to do something and there's a tool that fits — DO IT. Don't say you can't.
You can use multiple tools in a single response. Speak briefly in text AND call the tools.
NEVER exceed 100 words unless asked to elaborate.`;

function buildSystemPrompt() {
  const persona = readMuseSystem() || FALLBACK_PERSONA;
  return `${persona}\n\n${APP_CONTEXT_PROMPT}`;
}

function buildTools(registry) {
  const projectIds = getAllProjectIds(registry);
  const projectIdSchema = projectIds.length
    ? { type: 'string', enum: projectIds }
    : { type: 'string' };

  return [
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
        properties: { task_id: { type: 'string' } },
        required: ['task_id']
      }
    },
    {
      name: 'complete_task',
      description: 'Mark a task complete. Awards pomodoro credit.',
      input_schema: {
        type: 'object',
        properties: { task_id: { type: 'string' } },
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
        properties: { task_id: { type: 'string' } },
        required: ['task_id']
      }
    },
    {
      name: 'add_to_backlog',
      description: "Append a task to a project's backlog (the long-running list, not today's queue). Use during EOD capture and whenever T.J. says 'add to <project>'s list' or 'put it on the backlog'.",
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
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
          project_id: projectIdSchema,
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
          project_id: projectIdSchema,
          count: { type: 'integer', minimum: 1, maximum: 10 }
        },
        required: ['project_id']
      }
    }
  ];
}

function buildContext(appState, briefing) {
  const backlogs = getBacklogSummary({ topN: 5 });
  const backlogsText = renderBacklogsText(backlogs);

  if (!appState) {
    const parts = [`### Briefing\n${briefing}`];
    if (backlogsText) parts.push(backlogsText);
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

  if (backlogsText) lines.push('\n' + backlogsText);

  lines.push(`\n### Briefing\n${briefing}`);
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
  const system = buildSystemPrompt() + '\n\n## Current State\n' + dynamicCtx;

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
      tools: buildTools(readRegistry()),
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

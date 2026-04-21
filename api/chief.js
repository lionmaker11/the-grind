import Anthropic from '@anthropic-ai/sdk';
import {
  readRegistry,
  readMuseSystem,
  getAllProjectIds,
  getBacklogSummary,
  renderBacklogsText,
  detroitDayOfWeek
} from './_lib/vault.js';

// Fallback persona — used only if vault/systems/muse-system.md is unreadable.
// Canonical voice lives in the vault file.
const FALLBACK_PERSONA = `You are Muse, T.J.'s operator inside The Grind. Feminine. Commanding. Magnetic. No filler. No flattery. You listen, you file, you keep the board clean. You never push briefs. You never narrate the day back.`;

const CATEGORIES = ['In Business', 'On Business', 'Health', 'Family', 'Finances', 'Personal', 'Learning'];

const APP_CONTEXT_PROMPT = `## What You Know Here
You see the current project backlogs below. That is your source of truth for what exists. There is no daily queue, no briefing, no EOD narrative — those are retired surfaces. T.J. picks tasks himself off the board the app renders; your job is to keep the backlogs correct.

## Actions
Every action you take is a tool call. The frontend executes them against the backend. Match the user's intent to exactly the right tool — or nothing.

**Backlog tasks:**
- \`add_to_backlog\` — every new task. Requires \`priority\` (1-5, 1 = highest). If T.J. didn't state a priority, ask ONE question ("priority?") and wait. Do not guess.
- \`set_task_priority\` — change priority on an existing task.
- \`complete_backlog_task\` — mark done.
- \`remove_from_backlog\` — kill it.
- \`reorder_backlog\` — "move Pallister's list around" — pass the full new order.

**Projects:**
- \`add_project\` — only on explicit request. "New project: X."
- \`archive_project\` — "we're done with X", "park X".
- \`activate_project\` — bring back from archive.

## Rules
- Task IDs use project-prefixed form (e.g., \`pal-007\`, \`kb-014\`) — see the Project Backlogs section below.
- Project IDs must match the registry exactly. Match aliases to canonical IDs silently.
- You may call multiple tools in one response. Brief text in addition is allowed but optional — tools carry the meaning.
- Never exceed 100 words unless T.J. asks you to elaborate.
- If a request is ambiguous, ask ONE clarifying question. Wait. File. Stop.`;

function buildSystemPrompt(dayContext) {
  const persona = readMuseSystem() || FALLBACK_PERSONA;
  return `${persona}\n\n${APP_CONTEXT_PROMPT}\n\n${dayContext}`;
}

function buildDayContext(firstTurnToday) {
  const dow = detroitDayOfWeek();
  const isReviewDay = dow === 0 || dow === 4; // Sun or Thu
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow] || 'unknown';
  const lines = [`## Today\nDay: ${dayName} (America/Detroit).`];
  if (isReviewDay && firstTurnToday) {
    lines.push(`**Biweekly review day.** This is T.J.'s first message of the day. Open with a single-sentence invitation to re-rank one backlog ("${dayName} — re-rank a backlog?"). If he names one, render its tasks with priorities and ask "what changes?" If he declines or ignores, drop it. Do not re-prompt this same session.`);
  } else if (isReviewDay) {
    lines.push(`This is a review day (${dayName}), but not T.J.'s first turn — do not re-prompt the review if you already offered it earlier.`);
  }
  return lines.join('\n');
}

function buildTools(registry) {
  const projectIds = getAllProjectIds(registry);
  const projectIdSchema = projectIds.length
    ? { type: 'string', enum: projectIds, description: 'Registry project id. Match aliases before calling.' }
    : { type: 'string' };

  return [
    {
      name: 'add_to_backlog',
      description: "Add a new task to a project's backlog. Requires priority. If T.J. did not state a priority, ASK before calling — do not guess.",
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
          text: { type: 'string', description: 'Short imperative task text, ≤ 200 chars.' },
          priority: { type: 'integer', minimum: 1, maximum: 5, description: '1 = highest, 5 = lowest.' },
          done_condition: { type: 'string', description: 'What "done" looks like. Capture verbatim if stated; omit otherwise.' },
          category: { type: 'string', enum: CATEGORIES },
          estimated_pomodoros: { type: 'integer', minimum: 1, maximum: 8 }
        },
        required: ['project_id', 'text', 'priority']
      }
    },
    {
      name: 'set_task_priority',
      description: 'Change the priority of an existing backlog task.',
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
          task_id: { type: 'string', description: 'Project-prefixed id (e.g., pal-007).' },
          priority: { type: 'integer', minimum: 1, maximum: 5 }
        },
        required: ['project_id', 'task_id', 'priority']
      }
    },
    {
      name: 'complete_backlog_task',
      description: 'Mark a backlog task as done.',
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
          task_id: { type: 'string' }
        },
        required: ['project_id', 'task_id']
      }
    },
    {
      name: 'remove_from_backlog',
      description: "Delete a task from a project's backlog. Use when T.J. says drop/kill/scrap/no-longer-relevant.",
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
          task_id: { type: 'string' }
        },
        required: ['project_id', 'task_id']
      }
    },
    {
      name: 'reorder_backlog',
      description: "Reorder a project's backlog. Pass every task id in the new order.",
      input_schema: {
        type: 'object',
        properties: {
          project_id: projectIdSchema,
          order: {
            type: 'array',
            items: { type: 'string' },
            description: 'Full list of task ids in the desired order. Backend re-assigns P1-P5 by bucket.'
          }
        },
        required: ['project_id', 'order']
      }
    },
    {
      name: 'add_project',
      description: 'Register a new project. ONLY on explicit request ("new project: X"). Creates registry entry + empty backlog.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Human-readable project name.' },
          priority: { type: 'integer', minimum: 1, description: 'Project-level priority among other projects. Optional — defaults to max+1.' },
          aliases: { type: 'array', items: { type: 'string' } },
          note: { type: 'string' }
        },
        required: ['name']
      }
    },
    {
      name: 'archive_project',
      description: 'Mark a project inactive. It stays on disk but drops out of the active board.',
      input_schema: {
        type: 'object',
        properties: { project_id: projectIdSchema },
        required: ['project_id']
      }
    },
    {
      name: 'activate_project',
      description: 'Reactivate a previously-archived project.',
      input_schema: {
        type: 'object',
        properties: { project_id: projectIdSchema },
        required: ['project_id']
      }
    }
  ];
}

function buildContext() {
  const backlogs = getBacklogSummary({ topN: 5 });
  return renderBacklogsText(backlogs) || '### Project Backlogs\n(no active projects with backlogs)';
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

  const { message, conversation, firstTurnToday } = req.body || {};
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const dayContext = buildDayContext(Boolean(firstTurnToday));
  const systemPrompt = buildSystemPrompt(dayContext);
  const stateContext = buildContext();
  const system = `${systemPrompt}\n\n## Current State\n${stateContext}`;

  const messages = [];
  if (conversation && Array.isArray(conversation)) {
    conversation.slice(-20).forEach(m => {
      if ((m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
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
      tools: buildTools(readRegistry())
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
    return res.status(500).json({ error: err.message || 'Muse connection failed' });
  }
}

export const config = { maxDuration: 60 };

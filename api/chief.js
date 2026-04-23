import Anthropic from '@anthropic-ai/sdk';
import {
  readMuseSystem,
  readOnboardSystem,
  getAllProjectIds,
  getActiveProjects,
  fetchRegistryLive,
  getBacklogSummaryLive,
  renderBacklogsText,
  detroitDayOfWeek
} from './_lib/vault.js';

// Fallback persona — used only if vault/systems/muse-system.md is unreadable.
// Canonical voice lives in the vault file.
const FALLBACK_PERSONA = `You are Muse, T.J.'s operator inside The Grind. Feminine. Commanding. Magnetic. No filler. No flattery. You listen, you file, you keep the board clean. You never push briefs. You never narrate the day back.`;

const CATEGORIES = ['In Business', 'On Business', 'Health', 'Family', 'Finances', 'Personal', 'Learning'];

// Model routing by intent. Frontend sends `mode`; handler picks the model.
// Anything unknown falls through to `default`. Keep current prod (Sonnet 4.6)
// as the muse/default; Opus 4.7 reserved for onboarding + weekly recap.
const MODELS = {
  muse:    'claude-sonnet-4-6',
  onboard: 'claude-opus-4-7',
  recap:   'claude-opus-4-7',
  default: 'claude-sonnet-4-6'
};

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

// Stable head: persona + APP_CONTEXT_PROMPT. Does not change between
// requests within a day (vault/systems/muse-system.md is immutable at runtime).
// This is the portion we mark with cache_control for Anthropic prompt caching.
function buildStableSystemHead() {
  const persona = readMuseSystem() || FALLBACK_PERSONA;
  return `${persona}\n\n${APP_CONTEXT_PROMPT}`;
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

async function buildContext() {
  const backlogs = await getBacklogSummaryLive({ topN: 5 });
  return renderBacklogsText(backlogs) || '### Project Backlogs\n(no active projects with backlogs)';
}

// Onboarding extraction tool. Single tool, single call per request.
// Schema mirrors add_to_backlog's category enum (CATEGORIES) so the LOCK
// IT IN commit can forward extracted rows to /api/project + /api/backlog
// without field-name translation. Binary urgent replaces the 1-5 priority
// scale used in the deprecated 3-question flow (see phase4-redesign-spec.md).
const ONBOARD_EXTRACT_TOOL = {
  name: 'extract_onboarding',
  description: 'Extract projects, tasks, and orphan tasks from a single capture answer (plus optional clarify answer). Match extracted projects against existing vault entries via matched_existing_id + match_confidence so the review UI can offer merge instead of creating duplicates. Call exactly once per request.',
  input_schema: {
    type: 'object',
    required: ['projects', 'orphan_tasks', 'clarification_needed'],
    properties: {
      projects: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'urgent', 'matched_existing_id', 'match_confidence', 'tasks'],
          properties: {
            name: { type: 'string', description: 'Clean project name. Title Case. 1-3 words ideal.' },
            category: { type: 'string', enum: CATEGORIES, description: 'Best-fit category. Omit if unclear rather than guess.' },
            urgent: { type: 'boolean', description: 'True if ANY task is urgent OR user flagged the whole project as urgent. Binary — be conservative.' },
            matched_existing_id: { type: ['string', 'null'], description: 'EXACT id string from the "Existing projects in T.J.\'s vault" list in the system prompt. Use the verbatim id, never a name-derived guess. Null if no existing project matches.' },
            match_confidence: { type: 'number', minimum: 0, maximum: 1, description: '0.85+ = clear match (merge default on review). 0.3-0.8 = possible match (UI shows both options, no default). <0.3 = treat as new.' },
            note: { type: 'string', description: 'Optional one-sentence context.' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['text', 'urgent'],
                properties: {
                  text: { type: 'string', description: 'Action-first task. Starts with a verb.' },
                  urgent: { type: 'boolean', description: 'True if language contains urgency cues ("on fire", "overdue", "ASAP", explicit overdue dates, strong emotional framing). Default false. Be conservative.' },
                  category: { type: 'string', enum: CATEGORIES, description: 'Override parent project category only when cross-cutting.' }
                }
              }
            }
          }
        }
      },
      orphan_tasks: {
        type: 'array',
        description: 'Tasks that do not clearly belong to any project (neither named in transcript nor existing vault). User assigns on review. Empty array if none.',
        items: {
          type: 'object',
          required: ['text', 'urgent'],
          properties: {
            text: { type: 'string', description: 'Action-first task.' },
            urgent: { type: 'boolean' },
            category: { type: 'string', enum: CATEGORIES },
            suggested_new_project_name: { type: 'string', description: 'Short name suggestion if the orphan implies a category-level project (e.g. "Health" for a gym task). Omit if no clean suggestion.' }
          }
        }
      },
      clarification_needed: {
        type: ['object', 'null'],
        description: 'Single follow-up question if orphan_tasks is non-empty OR any project has match_confidence in 0.3-0.7. Null otherwise.',
        properties: {
          question: { type: 'string', description: 'One conversational sentence, concrete reference to the ambiguity.' }
        },
        required: ['question']
      }
    }
  }
};

const ONBOARD_FALLBACK_SYSTEM = `You are an extraction tool. The user message is a raw transcript of a single capture answer (optionally followed by a clarify answer). Call extract_onboarding exactly once with { projects, orphan_tasks, clarification_needed }. Per project: name, optional category from [In Business, On Business, Health, Family, Finances, Personal, Learning], urgent:boolean, matched_existing_id (string|null), match_confidence (0-1), optional note, tasks array. Per task: text, urgent:boolean, optional category. Orphan tasks: tasks not belonging to any project. clarification_needed: {question} if ambiguous (orphans present or match_confidence 0.3-0.7), null otherwise. Return { projects: [], orphan_tasks: [], clarification_needed: null } on empty input. No prose.`;

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

  const { message, conversation, firstTurnToday, mode } = req.body || {};
  const resolvedMode = typeof mode === 'string' && MODELS[mode] ? mode : 'default';
  const model = MODELS[resolvedMode];

  // Onboarding sends a three-answer transcript in a single user message,
  // which easily exceeds the Muse 2000-char ceiling. Allow more headroom
  // when mode=onboard.
  const maxMessageLen = resolvedMode === 'onboard' ? 8000 : 2000;
  if (!message || typeof message !== 'string' || message.length > maxMessageLen) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Per-mode request shape. Muse loads live registry + backlog state,
  // day context, prior conversation, and the full tool manifest. Onboard
  // is a single-shot extraction: static system prompt, one tool, no
  // registry, no conversation, no day context — transcript lives in the
  // sole user message.
  let system;
  let tools;
  let messages;
  let maxTokens;

  if (resolvedMode === 'onboard') {
    const onboardHead = readOnboardSystem() || ONBOARD_FALLBACK_SYSTEM;
    // Registry injection: read the live vault so Opus can detect matches
    // between extracted names and existing projects. Same read-path pattern
    // Muse uses below (fetchRegistryLive → getActiveProjects). Cached head
    // stays stable across onboarding sessions; the registry line sits
    // uncached so vault writes don't invalidate the cache prefix.
    const registry = await fetchRegistryLive();
    const activeProjects = getActiveProjects(registry);
    const registryLines = activeProjects
      .filter(p => p.id && p.name)
      .map(p => {
        const aliasStr = Array.isArray(p.aliases) && p.aliases.length
          ? ` · aliases: ${p.aliases.join(', ')}`
          : '';
        return `- id: "${p.id}" · name: "${p.name}"${aliasStr}`;
      });
    const registryTail = registryLines.length
      ? `## Existing projects in T.J.'s vault\n\n${registryLines.join('\n')}\n\nWhen the transcript mentions any of these (by name or alias), set matched_existing_id to the EXACT id string from the list above. Never invent or derive a slug — only use ids that appear verbatim in this list. If no existing project matches, set matched_existing_id to null.`
      : `## Existing projects in T.J.'s vault\n\n(none — first-time onboarding)\n\nSet matched_existing_id to null for all projects.`;
    system = [
      { type: 'text', text: onboardHead, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: registryTail }
    ];
    tools = [ONBOARD_EXTRACT_TOOL];
    messages = [{ role: 'user', content: message }];
    maxTokens = 4096;
  } else {
    const stableHead = buildStableSystemHead();
    const dayContext = buildDayContext(Boolean(firstTurnToday));
    // Registry + backlog summary read live from GitHub in parallel so the
    // tool manifest and "Current State" block reflect the latest vault
    // writes — including ones Muse herself made earlier this session.
    const [registry, stateContext] = await Promise.all([
      fetchRegistryLive(),
      buildContext()
    ]);
    const dynamicTail = `${dayContext}\n\n## Current State\n${stateContext}`;

    // System as an array of content blocks. The stable head carries
    // cache_control: ephemeral so Anthropic caches [tools + head] as the
    // prefix. The dynamic tail (day + state) sits uncached, so day-roll
    // and vault mutations don't invalidate the cache prefix.
    system = [
      { type: 'text', text: stableHead, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: dynamicTail }
    ];
    tools = buildTools(registry);
    messages = [];
    if (conversation && Array.isArray(conversation)) {
      conversation.slice(-20).forEach(m => {
        if ((m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
          messages.push({ role: m.role, content: m.content });
        }
      });
    }
    messages.push({ role: 'user', content: message });
    maxTokens = 1024;
  }

  const client = new Anthropic();
  const startedAt = Date.now();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      tools
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

    const usage = response.usage || {};
    console.log(JSON.stringify({
      event: 'chief_request',
      mode: resolvedMode,
      model,
      latency_ms: Date.now() - startedAt,
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      tool_calls_count: actions.length,
      cache_read_tokens: usage.cache_read_input_tokens || 0,
      cache_creation_tokens: usage.cache_creation_input_tokens || 0
    }));

    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ text: text.trim(), actions });
  } catch (err) {
    console.log(JSON.stringify({
      event: 'chief_error',
      mode: resolvedMode,
      model,
      latency_ms: Date.now() - startedAt,
      error: err?.message || 'unknown'
    }));
    return res.status(500).json({ error: err.message || 'Muse connection failed' });
  }
}

export const config = { maxDuration: 60 };

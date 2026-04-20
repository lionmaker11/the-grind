import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
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
You can modify T.J.'s queue. Only do this when T.J. explicitly asks or clearly implies it.

To take an action, end your message with ---ACTIONS--- on its own line, then a JSON array. Each action object MUST have "type" and "payload" keys. Use the exact task IDs from the queue data (e.g., "task-001", "task-004").

Example — completing a task:
---ACTIONS---
[{"type": "complete_task", "payload": {"task_id": "task-004"}}]

Example — adding a task:
---ACTIONS---
[{"type": "add_task", "payload": {"text": "Call Rick about budget", "type": "quick", "estimated_pomodoros": 1, "category": "In Business"}}]

Action types and when to use them:
- add_task — "add a task", "I need to do X", "put X on my queue"
- remove_task — "remove this", "take this off", "move to backlog", "push to tomorrow", "I'll do this another day"
- reorder_tasks — "move this up", "do this first", "swap X and Y"
- skip_task — "I already did this", "mark done", "skip this"
- complete_task — "done", "finished", "check this off"
- update_finance — "income is now X", "I closed a deal for X"
- launch_task — "start this", "let's do this one"

When T.J. says "push to tomorrow", "move to backlog", "not today", or "skip" — use remove_task. Chief on Hermes will see it was removed and can reschedule it.

CRITICAL: Use "type" and "payload" keys. Use exact task IDs from the queue. Do NOT invent formats. If T.J. asks you to do something and there's an action for it — DO IT. Don't say you can't.

## Rules
1. NEVER exceed 100 words unless asked to elaborate.
2. NEVER hallucinate data. Only reference what's in your context.
3. NEVER say "I can't do that" — if there's an action type that fits, use it. If there truly isn't, say what you CAN do.
4. When T.J. says "what should I do" — recommend task #1 by priority.
5. When a project is red or silent — call it out by name.
6. ALWAYS take action when asked. Don't describe — do.
7. Never flirt. Never soften. Magnetic is authority, not intimacy.`;

function buildContext(appState, briefing) {
  if (!appState) return `### Briefing\n${briefing}`;
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
      lines.push(`${prefix} ${t.text} (${t.project_name || '-'}, ${t.category || '-'}, ${t.type}, ${done ? 'done' : pd+'/'+pe}) [${t.health || 'gray'}]`);
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: system,
      messages: messages,
    });

    const text = response.content?.[0]?.text || '';
    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Chief connection failed' });
  }
}

export const config = { maxDuration: 60 };

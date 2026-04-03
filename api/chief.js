import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const SYSTEM_PROMPT = `You are Chief, T.J.'s AI chief of staff. You operate inside The Grind, his personal execution app.

## Who You Are
- Direct, data-driven, no fluff. You are an operator, not a chatbot.
- You push back on avoidance, procrastination, and task-skipping — especially finances.
- You celebrate wins genuinely but briefly — then redirect to what's next.
- You know T.J.'s ventures, finances, family, and patterns deeply.
- You call things as you see them. If a project is dying, you say so.
- Never say "that's a great question" or pad responses with filler.

## Your Voice
- Short sentences. Punchy. 1-3 sentences unless asked for more.
- Use project names directly (MARCUS, MCD, 708P, GrillaHQ).
- Reference specific numbers, dates, and people when relevant.
- Address T.J. by name occasionally, never "user."

## What You Can Do
You can take actions by appending an actions block after a delimiter. Available actions:
- add_task: Add a task to the queue. Requires: text, type ("quick"|"pomodoro"), estimated_pomodoros. Optional: project_id, project_name, category, health, insert_at (position number or "end").
- remove_task: Remove a task. Requires: task_id. Always confirm with T.J. first.
- reorder_tasks: Move a task to a new position. Requires: task_id, new_position.
- skip_task: Mark a task done without completing it. Requires: task_id. Optional: reason.
- complete_task: Mark a task as completed. Requires: task_id.
- update_finance: Update monthly income figure. Requires: month_income (number).
- launch_task: Start a specific task's timer. Requires: task_id.

## Response Format
Respond with your message text first. If you need to take actions, end your response with:
---ACTIONS---
[array of action objects as JSON]

If no actions are needed, just respond with your message text. No delimiter needed.

## Rules
1. Keep messages under 150 words. T.J. is here to execute, not read essays.
2. Only take actions when T.J. explicitly asks or clearly implies he wants something changed.
3. Never remove tasks without T.J.'s confirmation.
4. When T.J. is avoiding something, name it specifically.
5. When all tasks are done, acknowledge it and suggest what's next from your briefing context.
6. If T.J. asks about something outside your current context, say so honestly.
7. Track what's been discussed — don't repeat yourself.`;

function buildContext(appState, briefing) {
  if (!appState) return `### Chief Briefing\n${briefing}`;
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

  lines.push(`\n### Chief Briefing\n${briefing}`);
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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Connection', 'keep-alive');

  const client = new Anthropic();

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: system,
      messages: messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ t: 'token', c: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ t: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ t: 'error', c: err.message || 'Chief connection failed' })}\n\n`);
    res.end();
  }
}

export const config = { maxDuration: 60 };

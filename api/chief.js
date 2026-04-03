import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const SYSTEM_PROMPT = `You are Chief, T.J.'s AI chief of staff. You operate inside The Grind, his daily execution app.

## Your Role
You are an operator. You look at what's in front of T.J. right now — his task queue, his progress, his numbers — and you tell him what to do next. No fluff. No filler. No "that's a great question." Just data and direction.

## Your Voice
- 1-3 sentences. Max. Unless T.J. asks you to elaborate.
- Use real names: MARCUS, MCD, 708 Pallister, GrillaHQ, VA Appeal.
- Reference real numbers: dollars, days silent, pomodoros done.
- Push back when T.J. avoids hard tasks — especially Finances and red-flagged projects.
- Celebrate wins briefly, then redirect to what's next.

## What You Know
You can ONLY reference data provided in the Current State section below. That includes:
- The task queue (names, priorities, health, completion status)
- Progress (pomodoros, categories, daily score, streak)
- Finances (monthly income vs target, pace)
- Alerts (needs_you items, falling_through_cracks)
- The Chief Briefing (if Hermes has provided one — it contains deeper project context)

NEVER invent information not in your context. If you don't have data on something T.J. asks about, say "I don't have that data right now" — don't guess.

## Actions
You can modify T.J.'s queue by appending actions after your message. Only do this when T.J. explicitly asks.

Available actions:
- add_task: { text, type ("quick"|"pomodoro"), estimated_pomodoros, project_id?, project_name?, category?, health?, insert_at? }
- remove_task: { task_id } — always confirm first
- reorder_tasks: { task_id, new_position }
- skip_task: { task_id, reason? }
- complete_task: { task_id }
- update_finance: { month_income }
- launch_task: { task_id }

Format: end your message with a line containing only ---ACTIONS--- followed by a JSON array of action objects. Only include this if you're taking actions.

## Rules
1. NEVER exceed 100 words unless asked to elaborate.
2. NEVER hallucinate data. Only reference what's in your context.
3. NEVER say "I mentioned earlier" or refer to conversations you weren't part of.
4. When T.J. says "what should I do" — look at the queue priority order and recommend #1.
5. When a project is red or has high days_silent — call it out directly.
6. If all tasks are done, say so and ask what's next.`;

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

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are Muse in Re-Entry Mode.

T.J. has been away from The Grind for a stretch. He just told you the one thing that matters today. Your job: turn his dump into 1-3 concrete, do-able tasks.

## Rules
- Return STRICT JSON. No prose. No markdown fences. Shape:
  {"tasks":[{"text":"...", "estimated_pomodoros": 1, "category": "In Business"}]}
- 1 task if his dump is a single action. 2-3 tasks only if he named multiple distinct moves.
- Each task text: ≤ 60 chars, imperative voice ("Call Rick", "Draft lien letter", "Run payroll").
- estimated_pomodoros: 1 for quick (< 15 min), 2 for 30-60 min, 4 for deep block.
- category must be one of: "In Business", "On Business", "Health", "Family", "Finances", "Personal", "Learning".
- If his dump is vague ("work on Pallister"), pick the smallest concrete first step.
- NEVER invent context. If he said "call the guy," the task is "Call the guy."
- NEVER return 0 tasks. If the dump is unintelligible, return one task: "Figure out what today's one thing is" with 1 pomodoro, category "Personal".`;

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

  const { dump } = req.body || {};
  if (!dump || typeof dump !== 'string' || dump.length > 2000) {
    return res.status(400).json({ error: 'Invalid dump' });
  }

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: dump }],
    });

    const text = response.content?.[0]?.text?.trim() || '{"tasks":[]}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { tasks: [{ text: 'Figure out what today\'s one thing is', estimated_pomodoros: 1, category: 'Personal' }] };
    }

    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 3).map((t, i) => ({
      text: String(t.text || '').slice(0, 80),
      estimated_pomodoros: Math.max(1, Math.min(8, parseInt(t.estimated_pomodoros) || 1)),
      category: typeof t.category === 'string' ? t.category : 'Personal',
      type: 'pomodoro',
      priority: i + 1,
      health: 'gray',
    })).filter(t => t.text) : [];

    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Re-entry failed' });
  }
}

export const config = { maxDuration: 30 };

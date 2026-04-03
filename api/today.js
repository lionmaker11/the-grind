import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  try {
    // Read chief-briefing.md — the single source of truth
    const briefing = readFileSync(join(process.cwd(), 'chief-briefing.md'), 'utf-8');

    // Extract the ---QUEUE--- JSON block
    const queueDelimiter = '---QUEUE---';
    const queueIdx = briefing.indexOf(queueDelimiter);

    if (queueIdx >= 0) {
      const jsonStr = briefing.substring(queueIdx + queueDelimiter.length).trim();
      // Find the JSON object — it may be wrapped in ```json ... ``` or just raw
      let cleaned = jsonStr;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
      }
      try {
        const queue = JSON.parse(cleaned);
        return res.status(200).json(queue);
      } catch (parseErr) {
        // JSON parse failed — fall back to static today.json
        console.error('Queue JSON parse error:', parseErr.message);
      }
    }

    // Fallback: try static today.json
    try {
      const todayFile = readFileSync(join(process.cwd(), 'today.json'), 'utf-8');
      return res.status(200).json(JSON.parse(todayFile));
    } catch {
      return res.status(404).json({ error: 'No queue data available. Chief has not pushed a briefing with ---QUEUE--- block.' });
    }
  } catch (err) {
    // No briefing file at all — try static today.json
    try {
      const todayFile = readFileSync(join(process.cwd(), 'today.json'), 'utf-8');
      return res.status(200).json(JSON.parse(todayFile));
    } catch {
      return res.status(404).json({ error: 'No data files found.' });
    }
  }
}

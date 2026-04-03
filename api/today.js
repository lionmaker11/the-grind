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
      let jsonStr = briefing.substring(queueIdx + queueDelimiter.length).trim();
      // Strip end delimiter if present (Chief may add ---END QUEUE---)
      const endDelimiters = ['---END QUEUE---', '---END-QUEUE---', '---ENDQUEUE---'];
      for (const end of endDelimiters) {
        const endIdx = jsonStr.indexOf(end);
        if (endIdx >= 0) jsonStr = jsonStr.substring(0, endIdx).trim();
      }
      // Strip code fences if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
      }
      try {
        const queue = JSON.parse(jsonStr);
        return res.status(200).json(queue);
      } catch (parseErr) {
        // JSON parse failed — fall back to static today.json
        console.error('Queue JSON parse error:', parseErr.message);
        console.error('Raw JSON string (first 200 chars):', jsonStr.substring(0, 200));
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

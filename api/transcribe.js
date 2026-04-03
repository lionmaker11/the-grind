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

  const { audio, mimeType } = req.body;
  if (!audio) return res.status(400).json({ error: 'No audio data' });

  const audioBuffer = Buffer.from(audio, 'base64');
  const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('webm') ? 'webm' : 'm4a';

  // Build multipart form data for Groq Whisper API
  const boundary = '----FormBoundary' + Date.now();
  const formParts = [];

  formParts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="voice.${ext}"\r\n` +
    `Content-Type: ${mimeType || 'audio/mp4'}\r\n\r\n`
  );
  formParts.push(audioBuffer);
  formParts.push('\r\n');

  formParts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `whisper-large-v3-turbo\r\n`
  );

  formParts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language"\r\n\r\n` +
    `en\r\n`
  );

  formParts.push(`--${boundary}--\r\n`);

  const bodyParts = formParts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
  const body = Buffer.concat(bodyParts);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: 'Groq Whisper error', details: errText });
    }

    const result = await groqRes.json();
    return res.status(200).json({ text: result.text || '' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Transcription failed' });
  }
}

export const config = { maxDuration: 30 };

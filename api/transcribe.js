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

  // iOS Safari sends `audio/mp4;codecs=mp4a.40.2` (AAC-in-MP4). Groq's
  // Whisper endpoint sniffs by filename extension, and its AAC-in-MP4 path
  // is more reliable with `.m4a` than `.mp4`. Normalize mp4-family → m4a.
  // Also strip any `;codecs=…` parameter from the Content-Type we send up,
  // since some proxies choke on the parameter form.
  const mt = (mimeType || '').toLowerCase();
  const isMp4Family = mt.includes('mp4') || mt.includes('aac') || mt.includes('m4a');
  const isWebm = mt.includes('webm');
  const ext = isWebm ? 'webm' : isMp4Family ? 'm4a' : 'm4a';
  const canonicalMime = isWebm ? 'audio/webm' : 'audio/mp4';

  // Phase 3 iOS diagnostic — remove once Safari path is confirmed stable.
  console.log(JSON.stringify({
    event: 'transcribe_request',
    incoming_mime: mimeType || null,
    chosen_ext: ext,
    canonical_mime: canonicalMime,
    audio_bytes: audioBuffer.length,
    first_8_bytes_hex: audioBuffer.slice(0, 8).toString('hex')
  }));

  // Build multipart form data for Groq Whisper API
  const boundary = '----FormBoundary' + Date.now();
  const formParts = [];

  formParts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="voice.${ext}"\r\n` +
    `Content-Type: ${canonicalMime}\r\n\r\n`
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
      // Phase 3 iOS diagnostic — log the full Groq rejection so we can see
      // exactly what the provider objected to.
      console.log(JSON.stringify({
        event: 'transcribe_groq_error',
        groq_status: groqRes.status,
        groq_status_text: groqRes.statusText,
        groq_body: errText.slice(0, 2000),
        upload_filename: `voice.${ext}`,
        upload_content_type: canonicalMime,
        audio_bytes: audioBuffer.length
      }));
      return res.status(groqRes.status).json({
        error: 'Groq Whisper error',
        details: `${groqRes.status} ${groqRes.statusText} — ${errText.slice(0, 200)}`
      });
    }

    const result = await groqRes.json();
    console.log(JSON.stringify({
      event: 'transcribe_success',
      text_length: (result.text || '').length,
      audio_bytes: audioBuffer.length
    }));
    return res.status(200).json({ text: result.text || '' });
  } catch (err) {
    console.log(JSON.stringify({
      event: 'transcribe_exception',
      message: err?.message || String(err)
    }));
    return res.status(500).json({ error: err.message || 'Transcription failed' });
  }
}

export const config = { maxDuration: 30 };

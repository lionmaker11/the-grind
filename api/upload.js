import { randomUUID } from 'crypto';

const REPO = 'lionmaker11/the-grind';
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

async function ghPut(path, base64Content, message) {
  const resp = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'the-grind-upload'
    },
    body: JSON.stringify({ message, content: base64Content })
  });
  return resp;
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

  const { image, mimeType, attached_to } = req.body || {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing image (base64 string)' });
  }
  if (!mimeType || !EXT_BY_MIME[mimeType]) {
    return res.status(400).json({ error: 'Unsupported mimeType. Use image/jpeg, image/png, or image/webp.' });
  }

  const byteLength = Math.ceil((image.length * 3) / 4);
  if (byteLength > MAX_BYTES) {
    return res.status(413).json({ error: `Image exceeds ${MAX_BYTES} bytes` });
  }

  const ext = EXT_BY_MIME[mimeType];
  const uuid = randomUUID();
  const date = new Date().toISOString().slice(0, 10);
  const path = `vault/attachments/${date}/${uuid}.${ext}`;

  const context = attached_to?.kind && attached_to?.id
    ? `${attached_to.kind}:${attached_to.id}`
    : 'unattached';

  const resp = await ghPut(path, image, `attachments: upload ${uuid}.${ext} (${context})`);
  if (!resp.ok) {
    const err = await resp.text();
    return res.status(resp.status).json({ ok: false, error: err });
  }

  return res.status(200).json({ ok: true, url: path, uuid });
}

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
  maxDuration: 30
};

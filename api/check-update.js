const REPO = 'lionmaker11/the-grind';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/contents/today.json`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'the-grind-check'
      }
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'GitHub API error' });
    }

    const data = await resp.json();
    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.status(200).json({ sha: data.sha, size: data.size });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

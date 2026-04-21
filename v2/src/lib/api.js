// Single fetch wrapper for /api/* backend calls. Adds the X-Chief-Token
// auth header on every request and retries GET twice on failure with
// exponential backoff (300ms, 600ms). POST retries are NOT added here —
// mutations should surface errors immediately.
//
// Phase 2 only needs getBacklog(). Phase 3 (Muse) and Phase 5 (board
// interactions) will add the rest per DESIGN.md §7.

const TOKEN = import.meta.env.VITE_CHIEF_AUTH_TOKEN;

async function getJson(url, { retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = TOKEN ? { 'X-Chief-Token': TOKEN } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = 300 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

export const getBacklog = () => getJson('/api/backlog');

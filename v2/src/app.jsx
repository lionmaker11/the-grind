import { useEffect, useState } from 'preact/hooks';

// Phase 1 smoke-test root. Proves the scaffold fetches live vault data
// from /api/backlog through the Vite dev proxy. Everything you see here
// (the raw <pre>, the ad-hoc inline styles) is throwaway — Phase 2 replaces
// this with TopBar + Board.
export function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = import.meta.env.VITE_CHIEF_AUTH_TOKEN;
    const headers = token ? { 'X-Chief-Token': token } : {};
    fetch('/api/backlog', { headers })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(String(e.message || e)); setLoading(false); });
  }, []);

  return (
    <>
      <div class="grid-overlay" />
      <header
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '4px',
          color: 'var(--cyan)',
          textTransform: 'uppercase',
          marginBottom: 'var(--s-2)'
        }}
      >
        THEGRIND &middot; PHASE 1 &middot; FOUNDATION
      </header>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--t-xs)',
          letterSpacing: '2px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: 'var(--s-4)'
        }}
      >
        {'// /api/backlog — live payload'}
      </div>

      {loading && (
        <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {'// awaiting response...'}
        </div>
      )}

      {error && (
        <pre style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
          {`// ERROR\n${error}`}
        </pre>
      )}

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </>
  );
}

import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';

// Dev proxy: the Vercel serverless functions at /api/* live at the repo root,
// not inside /v2/. In dev, we proxy /api/* to a live Vercel preview deployment
// that has CHIEF_AUTH_TOKEN, ANTHROPIC_API_KEY, GROQ_API_KEY, and GITHUB_TOKEN
// configured. Set VITE_API_PROXY_TARGET in .env.local to point at the current
// preview URL (e.g., https://the-grind-git-v2-build-<team>.vercel.app).
//
// In production, /v2/ is served as a static bundle from the same Vercel
// deployment that hosts /api/*, so /api/* calls resolve natively with no proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'https://the-grind-gold.vercel.app';

  return {
    plugins: [preact()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true
        }
      }
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    }
  };
});

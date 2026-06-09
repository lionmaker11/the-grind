import { render } from 'preact';
import { App } from './app.jsx';
import './tokens.css';
import './global.css';

render(<App />, document.getElementById('app'));

// Phase 7: service worker registration. Production builds only — a SW
// in dev caches Vite's module graph and turns every HMR session into
// an archaeology dig. Registration failure is non-fatal (the app works
// identically without offline support); log and move on. The SW at
// scope '/' also takes over and killswitches any V1-era worker.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

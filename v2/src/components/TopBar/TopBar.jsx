import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { boardStore } from '../../state/board.js';
import { museStore } from '../../state/muse.js';
import './TopBar.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const ACTION_WINDOW_MS = 10_000;

function formatClock(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]} · ${h}:${m}`;
}

export function TopBar() {
  const { error } = useStore(boardStore);
  const { lastAction, lastActionAt } = useStore(museStore);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  // Tick `now` while an action is within the 10s window so the badge
  // auto-expires back to clock/offline without further user interaction.
  useEffect(() => {
    if (!lastActionAt) return;
    const elapsed = Date.now() - lastActionAt;
    if (elapsed >= ACTION_WINDOW_MS) return;
    setNow(Date.now());
    const id = setTimeout(() => setNow(Date.now()), ACTION_WINDOW_MS - elapsed);
    return () => clearTimeout(id);
  }, [lastActionAt]);

  const actionActive = lastAction && (now - lastActionAt) < ACTION_WINDOW_MS;

  let statusClass = 'topbar-status';
  let statusText;
  if (actionActive) {
    statusClass = 'topbar-status action';
    statusText = `// ACTION · ${lastAction}`;
  } else if (error) {
    statusClass = 'topbar-status offline';
    statusText = '// OFFLINE';
  } else {
    statusText = clock;
  }

  return (
    <header class="topbar">
      <img src="/assets/lionmaker-logo.png" class="logo-mark" alt="Lionmaker" />
      <span class="wordmark">THEGRIND</span>
      <span class={statusClass} data-testid="topbar-status">{statusText}</span>
    </header>
  );
}

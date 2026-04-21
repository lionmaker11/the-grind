import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { boardStore } from '../../state/board.js';
import './TopBar.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatClock(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]} · ${h}:${m}`;
}

export function TopBar() {
  const { error } = useStore(boardStore);
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  const statusClass = error ? 'topbar-status offline' : 'topbar-status';
  const statusText = error ? '// OFFLINE' : clock;

  return (
    <header class="topbar">
      <img src="/assets/lionmaker-logo.png" class="logo-mark" alt="Lionmaker" />
      <span class="wordmark">THEGRIND</span>
      <span class={statusClass}>{statusText}</span>
    </header>
  );
}

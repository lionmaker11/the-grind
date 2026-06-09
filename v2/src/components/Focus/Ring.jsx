// Ring.jsx — the sacred SVG timer, ported verbatim from mockup
// 06-focus-work.html per DESIGN.md §Ring.jsx ("ported from V1 nearly
// verbatim — this is the sacred piece").
//
// Layers, outside in: pulse circle (animates only while running),
// rotating outer hex (20s), counter-rotating dashed inner hex (30s),
// base circle r=108, progress circle (dashoffset tied to
// timeLeft/totalTime), 60 generated tick lines (every 5th brighter),
// inner display (Orbitron time + mono mode label).
//
// One SVG serves all modes: stroke colors reference the --ring-color
// custom property, set by Focus.css per mode class (cyan work / green
// break / magenta reboot). Rotation + pulse animations live in
// Ring.css with a prefers-reduced-motion kill switch (D7).

import './Ring.css';

const R = 108;
const CIRCUMFERENCE = 2 * Math.PI * R; // 678.58…
const CX = 125;
const CY = 125;

// 60 tick marks around the dial, generated once at module load —
// identical geometry to the mockup's pre-baked <line> soup. Every 5th
// tick (minute markers) is longer + brighter.
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const angle = (i * 6 - 90) * (Math.PI / 180);
  const major = i % 5 === 0;
  const r1 = 114;
  const r2 = major ? 122 : 118;
  return {
    x1: +(CX + r1 * Math.cos(angle)).toFixed(2),
    y1: +(CY + r1 * Math.sin(angle)).toFixed(2),
    x2: +(CX + r2 * Math.cos(angle)).toFixed(2),
    y2: +(CY + r2 * Math.sin(angle)).toFixed(2),
    opacity: major ? 0.55 : 0.22
  };
});

function formatTime(seconds) {
  const s = Math.max(0, seconds | 0);
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

const MODE_LABEL = {
  work: '// FOCUS',
  break: '// BREAK',
  'long-break': '// REBOOT'
};

export function Ring({ mode, timeLeft, totalTime, running }) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const label = running || mode !== 'work'
    ? (MODE_LABEL[mode] || '// FOCUS')
    : '// PAUSED_';

  return (
    <div class={`ring-wrap${running ? ' running' : ''}`} data-testid="focus-ring">
      <svg viewBox="0 0 250 250" class="ring-svg">
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* pulse ring — animates while running (Ring.css) */}
        <circle
          class="ring-pulse"
          cx={CX} cy={CY} r="124"
          fill="none"
          stroke="var(--ring-color)"
          stroke-opacity="0.15"
          stroke-width="1"
        />

        {/* outer hex — slow rotation */}
        <g class="ring-hex-outer">
          <polygon
            points="125,1 232,63 232,187 125,249 18,187 18,63"
            fill="none"
            stroke="var(--ring-color)"
            stroke-opacity="0.28"
            stroke-width="1"
          />
        </g>

        {/* inner dashed hex — counter rotation */}
        <g class="ring-hex-inner">
          <polygon
            points="125,29 208,77 208,173 125,221 42,173 42,77"
            fill="none"
            stroke="var(--ring-color)"
            stroke-opacity="0.38"
            stroke-width="1"
            stroke-dasharray="4 4"
          />
        </g>

        {/* base circle */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="var(--ring-color)"
          stroke-opacity="0.12"
          stroke-width="2"
        />

        {/* progress */}
        <circle
          data-testid="ring-progress"
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="var(--ring-color)"
          stroke-width="3"
          stroke-dasharray={CIRCUMFERENCE.toFixed(2)}
          stroke-dashoffset={dashOffset.toFixed(2)}
          stroke-linecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          style="filter:url(#ring-glow)"
        />

        {/* 60 tick marks */}
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="var(--ring-color)"
            stroke-opacity={t.opacity}
            stroke-width="1"
          />
        ))}
      </svg>

      <div class="ring-inner">
        <div
          class={`ring-time${running ? '' : ' paused'}`}
          data-testid="ring-time"
        >
          {formatTime(timeLeft)}
        </div>
        <div class="ring-label" data-testid="ring-label">{label}</div>
      </div>
    </div>
  );
}

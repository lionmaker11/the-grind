// Pure heartbeat helpers. See DESIGN.md §4 for the color map.
//   null → gray   (cold project, no last_touched in registry)
//   0–3  → green
//   3–7  → yellow
//   7+   → red (pulses)

const DAY_MS = 86_400_000;

export function daysSince(lastTouchedISO) {
  if (!lastTouchedISO) return null;
  const ts = Date.parse(lastTouchedISO);
  if (Number.isNaN(ts)) return null;
  return Math.floor((Date.now() - ts) / DAY_MS);
}

export function heartbeatClassFor(lastTouchedISO) {
  const d = daysSince(lastTouchedISO);
  if (d == null) return 'gray';
  if (d < 3) return 'green';
  if (d < 7) return 'yellow';
  return 'red';
}

import { heartbeatClassFor } from '../../lib/heartbeat.js';
import './HeartbeatDot.css';

export function HeartbeatDot({ lastTouched }) {
  const cls = heartbeatClassFor(lastTouched);
  return <span class={`heartbeat ${cls}`} aria-hidden="true" />;
}

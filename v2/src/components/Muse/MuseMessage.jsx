import './MuseMessage.css';

// Single bubble. Variants: user | muse | action (+ action.error).
// Content is the message text. No markdown rendering — Muse is capped at
// 100 words and prose, so we stay with plain text.
export function MuseMessage({ msg }) {
  const { role, content, variant } = msg;
  const classes = [
    'muse-bubble',
    `muse-bubble--${role}`,
    variant === 'error' ? 'muse-bubble--error' : ''
  ].filter(Boolean).join(' ');

  return (
    <div class={classes} data-role={role} data-testid={`muse-bubble-${role}`}>
      {content}
    </div>
  );
}

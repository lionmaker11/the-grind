// Shared conversation bubble. Variants:
//   role='muse' — magenta bubble, with avatar, align-left
//   role='user' — cyan bubble, no avatar, align-right
//   variant='dashed' — live transcript (during recording)
//   variant='finalized' — transcript after stop (solid border, no caret)

export function OnboardMessage({ role = 'muse', variant, text, showCaret = false }) {
  if (role === 'muse') {
    return (
      <div class="om-row om-row--muse">
        <div class="om-avatar" aria-hidden="true">M</div>
        <div class="om-bubble om-bubble--muse">{text}</div>
      </div>
    );
  }

  const cls = [
    'om-row',
    'om-row--user',
    variant === 'dashed' ? 'om-row--dashed' : '',
    variant === 'finalized' ? 'om-row--finalized' : ''
  ].filter(Boolean).join(' ');

  return (
    <div class={cls}>
      <div class="om-bubble om-bubble--user">
        {text}
        {showCaret && <span class="om-caret" aria-hidden="true" />}
      </div>
    </div>
  );
}

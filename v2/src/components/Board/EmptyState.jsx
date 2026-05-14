import './EmptyState.css';

export function EmptyState() {
  return (
    <div class="empty-state" data-testid="board-empty-state">
      <div class="empty-title">AWAITING INPUT</div>
      <div class="empty-body">All projects clear. Tell Muse what's next.</div>
      <button class="empty-cta" type="button">
        <span class="dot" aria-hidden="true" />
        <span>OPEN MUSE</span>
      </button>
      <div class="empty-hint">OR TAP ● BOTTOM-RIGHT</div>
      <div class="empty-footer">// NEW PROJECT? JUST TELL MUSE.</div>
    </div>
  );
}

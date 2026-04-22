// longpress.js — 500ms hold gesture for a single element.
//
// Factory returns a `{ props() }` object to spread on the target. Fires
// onLongPress if the user holds durationMs without moving more than
// moveThresholdPx; fires onTap if they release before durationMs with no
// significant movement; no-op otherwise.
//
// Designed to compose with drag.js on the same element. Both share the
// same pointerdown, and movement past the threshold cancels the hold
// cleanly so drag wins without longpress firing a stray callback.
//
// ── CSS contract (component-supplied) ────────────────────────────────
//
//   .task-row.longpress-active {
//     /* applied from pointerdown until fire / cancel / release.
//        typical: amber outline, soft pulse. example: */
//     outline: 2px solid rgba(245, 158, 11, 0.8);
//     transition: outline-color 80ms ease-out;
//   }
//
// The class lives for at most durationMs (500ms default) on a
// successful hold, or until the pointer moves past threshold (cancel),
// or until release (tap / cancel). Component owns the visual; the
// utility only toggles the class.
//
// ── Coexistence with drag.js ─────────────────────────────────────────
//
// Spread both prop objects on the handle:
//
//   <span {...drag.handleProps(i)} {...lp.props()}>≡</span>
//
// Longpress does NOT set touch-action. If composed with drag, drag's
// handleProps supplies `touch-action: none` for the handle. On a
// longpress-only element (no drag), leaving touch-action at auto is
// correct — native scroll should win past the cancel threshold.
//
// ── Gotchas ──────────────────────────────────────────────────────────
//
// 1. Per-render instantiation is fine. Each createLongPress call
//    allocates a closure and a few state slots; no listeners attach
//    until pointerdown. In a list, the natural pattern is one instance
//    per row (closure-captures row idx). R5 may memoize via useMemo
//    from preact/hooks if profiling warrants.
//
// 2. navigator.vibrate is best-effort. iOS Safari ignores it silently;
//    Android Chrome honors it. Wrapped in a try/catch so an unsupported
//    browser never throws.
//
// 3. Each createLongPress instance tracks one pointer at a time.
//    Different elements get different instances, so two list items can
//    be tracked independently — the constraint is per-instance, not
//    global. Within a single instance, multi-touch pointerdown events
//    beyond the first are ignored until the tracked pointer releases
//    or cancels.
//
// ── Lifecycle ────────────────────────────────────────────────────────
//
// No explicit destroy() method — all listeners are element-scoped
// (not window-scoped) and garbage-collect when the element unmounts.
// The only long-lived state is the setTimeout timer; if the tracked
// element unmounts during the hold window, the timer fires against a
// detached element (classList operations on a detached element are
// no-ops, onLongPress still fires). If that matters, wrap onLongPress
// in an is-mounted check at the component level. Baseline is fine.

export function createLongPress({
  durationMs = 500,
  moveThresholdPx = 8,
  onLongPress,
  onTap,
  activeClass = 'longpress-active',
} = {}) {
  // { el, pointerId, startX, startY, moved, fired, timer } | null
  let state = null;

  function clear(fireTap) {
    if (!state) return;
    const { el, timer, fired, moved } = state;
    clearTimeout(timer);
    if (el) el.classList.remove(activeClass);
    state = null;
    if (fireTap && !fired && !moved && onTap) onTap();
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    // If another pointer is already being tracked, ignore this one.
    if (state) return;

    const el = e.currentTarget;
    el.classList.add(activeClass);

    state = {
      el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fired: false,
      timer: 0,
    };

    state.timer = setTimeout(() => {
      if (!state || state.moved) return;
      state.fired = true;
      state.el.classList.remove(activeClass);
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch {
        // haptics unsupported — silent
      }
      if (onLongPress) onLongPress();
    }, durationMs);
  }

  function onPointerMove(e) {
    if (!state || e.pointerId !== state.pointerId || state.moved || state.fired) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (Math.hypot(dx, dy) >= moveThresholdPx) {
      state.moved = true;
      clearTimeout(state.timer);
      state.el.classList.remove(activeClass);
      // Leave `state` in place until pointerup/cancel so we don't
      // mistake a late release for a fresh tap on a different element.
    }
  }

  function onPointerUp(e) {
    if (!state || e.pointerId !== state.pointerId) return;
    clear(true);
  }

  function onPointerCancel(e) {
    if (!state || e.pointerId !== state.pointerId) return;
    clear(false);
  }

  return {
    props() {
      return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
      };
    },
  };
}

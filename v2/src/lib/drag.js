// drag.js — press-and-hold vertical reorder within a list container.
//
// Factory returns a controller with itemProps / handleProps / destroy.
// Components spread itemProps on each row, handleProps on the drag glyph.
// Movement-triggered activation (no hold timer) so it composes cleanly
// with longpress.js on the same handle — both share the moveThresholdPx
// and diverge at the first significant pointer movement.
//
// ── CSS contract (component-supplied) ────────────────────────────────
//
// The utility mutates inline `transform` and toggles one class. All
// visuals are the component's. Expected stylesheet shape:
//
//   .task-row {
//     transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
//   }
//   .task-row.dragging {
//     transition: none;            /* REQUIRED — see below */
//     transform: scale(1.02);      /* lift feel, component's call */
//     box-shadow: 0 8px 24px rgba(0,0,0,0.18);
//     z-index: 10;
//     /* note: the transform: scale(...) is COMBINED with the utility's
//        inline transform: translateY(...) by the browser. If the class
//        rule and the inline rule both declare `transform`, the inline
//        wins. Use a separate visual cue (background, shadow, outline)
//        instead of transform: scale on the .dragging state — or accept
//        that the scale won't apply during drag. */
//   }
//
// Why the transition is disabled on .dragging: the utility writes
// `transform: translateY(...)` at pointer-move frequency (60Hz). A
// `transition: transform 180ms` on the dragged row would smear every
// frame through 180ms of easing and look like mush. Displaced sibling
// rows DO want the transition — they shift by a full row-height in
// discrete jumps and the easing smooths those jumps.
//
// ── Coexistence with longpress.js ────────────────────────────────────
//
// Spread both prop objects on the handle element:
//
//   <span {...drag.handleProps(i)} {...lp.props()}>≡</span>
//
// Drag engages on 8px+ pointer movement. Longpress cancels on 8px+
// pointer movement. Same threshold, opposite reactions — no ambiguity
// window. Hold without moving → longpress fires at 500ms; drag never
// engaged. Move past threshold → drag engages; longpress canceled.
//
// `touchAction: 'none'` in handleProps disables native scroll inside
// the handle, so vertical finger drag reorders instead of scrolling
// the page. Longpress does not set touch-action (it needs native
// scroll to win past the cancel threshold on longpress-only elements).
//
// ── Gotchas ──────────────────────────────────────────────────────────
//
// 1. Refs are stored in a Map<idx, HTMLElement>. When Preact unmounts a
//    row or swaps the ref function between renders, the ref callback
//    fires with null first, then with the new element. The Map clears
//    stale slots automatically.
//
// 2. During drag, the utility writes transforms DIRECTLY to the DOM.
//    Preact does not re-render until onReorder fires on release. This
//    is intentional — the reconciler at 60Hz is expensive, and keeping
//    the drag animation in the DOM layer keeps it smooth.
//
// 3. One controller per list. Creating two controllers for the same
//    list would produce two independent drag states fighting over the
//    same DOM nodes. If the same page has multiple lists (e.g. one
//    project panel per project on the review screen), each list gets
//    its own createListDragController call.
//
// 4. Controllers are cheap — per-render reinstantiation is fine. The
//    controller holds no listeners until pointerdown fires. R5 may
//    memoize via useMemo if profiling warrants; baseline does not.
//
// ── Lifecycle ────────────────────────────────────────────────────────
//
// If the component using this controller may unmount mid-drag (e.g.,
// user navigates away while dragging, or a parent re-renders and the
// list collapses), call destroy() from the component's unmount hook.
// Otherwise the window listeners attached on pointerdown may leak
// until the page reloads. In practice this is rare — most unmounts
// happen after pointerup — but explicit cleanup is cheap.

export function createListDragController({
  onReorder,
  moveThresholdPx = 8,
  draggingClass = 'dragging',
} = {}) {
  // idx → live HTMLElement. Written by ref callbacks on mount/re-render,
  // cleared (via delete) when a ref fires with null on unmount.
  const items = new Map();

  // Mutable drag state; null when no drag is in flight.
  // { fromIdx, toIdx, startY, pointerId, handleEl, engaged, rowHeight }
  let drag = null;

  function setItem(idx, el) {
    if (el) items.set(idx, el);
    else items.delete(idx);
  }

  function onPointerDownHandle(idx, e) {
    // Ignore non-primary mouse buttons. Touch and pen report button:0.
    if (e.button !== undefined && e.button !== 0) return;
    // Abort any stale state defensively (shouldn't happen in practice).
    if (drag) cleanup();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {
      // Older browsers without pointer capture — listeners on window
      // still track the pointer, just less reliably outside the element.
    }

    drag = {
      fromIdx: idx,
      toIdx: idx,
      startY: e.clientY,
      pointerId: e.pointerId,
      handleEl,
      engaged: false,
      rowHeight: 0,
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
  }

  function engage() {
    const el = items.get(drag.fromIdx);
    if (!el) {
      cleanup();
      return false;
    }
    drag.rowHeight = el.getBoundingClientRect().height;
    el.classList.add(draggingClass);
    drag.engaged = true;
    return true;
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const delta = e.clientY - drag.startY;

    if (!drag.engaged) {
      if (Math.abs(delta) < moveThresholdPx) return;
      if (!engage()) return;
    }

    const draggedEl = items.get(drag.fromIdx);
    if (!draggedEl) return;

    // Move the dragged row with the finger.
    draggedEl.style.transform = `translateY(${delta}px)`;

    // Compute target slot assuming uniform row height (the dragged
    // row's own height). Works well for lists where rows are visually
    // similar; slightly imprecise for wildly heterogeneous rows but
    // still correct in the final fromIdx/toIdx pair on release.
    const offset = Math.round(delta / drag.rowHeight);
    const count = items.size;
    let toIdx = drag.fromIdx + offset;
    if (toIdx < 0) toIdx = 0;
    if (toIdx > count - 1) toIdx = count - 1;
    drag.toIdx = toIdx;

    // Displace non-dragged rows to open a gap at the insertion point.
    // Rows between fromIdx and toIdx shift by ±rowHeight; others clear.
    const { fromIdx, rowHeight } = drag;
    items.forEach((node, i) => {
      if (i === fromIdx) return;
      let shift = 0;
      if (fromIdx < toIdx && i > fromIdx && i <= toIdx) {
        shift = -rowHeight;
      } else if (fromIdx > toIdx && i < fromIdx && i >= toIdx) {
        shift = rowHeight;
      }
      node.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { fromIdx, toIdx, engaged } = drag;
    cleanup();
    if (engaged && fromIdx !== toIdx) onReorder(fromIdx, toIdx);
  }

  function onPointerCancel(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    cleanup();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') cleanup();
  }

  function cleanup() {
    if (!drag) return;
    const { fromIdx, handleEl, pointerId } = drag;
    const draggedEl = items.get(fromIdx);
    if (draggedEl) draggedEl.classList.remove(draggingClass);
    // Reset every node's transform — any may carry a displacement from
    // the most recent pointermove.
    items.forEach((node) => {
      node.style.transform = '';
    });
    try {
      if (handleEl && handleEl.hasPointerCapture?.(pointerId)) {
        handleEl.releasePointerCapture(pointerId);
      }
    } catch {
      // no-op
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('keydown', onKeyDown);
    drag = null;
  }

  return {
    itemProps(idx) {
      return {
        ref: (el) => setItem(idx, el),
        'data-drag-idx': idx,
      };
    },
    handleProps(idx) {
      return {
        onPointerDown: (e) => onPointerDownHandle(idx, e),
        style: { touchAction: 'none' },
      };
    },
    destroy() {
      cleanup();
    },
  };
}

// Phase 5b-10 mobile-emulation verification — iPhone 13 viewport
// (390x844), WebKit engine, touch enabled. Runs ONLY under the
// `iphone` Playwright project (see playwright.config.js testMatch).
//
// Substitutes for the physical phone test where emulation carries
// real signal. Maps to the phone-test agenda in reviewer-context.md
// / phase5b-status.md:
//   - Agenda #1 (drag-handle scroll-blocking): verified structurally —
//     handles carry touch-action:none; body scrolls; text column does
//     NOT block scroll
//   - Agenda #6 (mixed-height drag accuracy): REGRESSION TEST for the
//     5b-10 drag.js nearest-center fix — discriminating delta that the
//     old uniform-height math got wrong
//   - Agenda #8 (keyboard occlusion): edit input scrollIntoView keeps
//     the input inside the visual viewport when editing a bottom row
//   - Layout sanity at 390px: modal fits, no horizontal overflow,
//     44px touch targets
//
// NOT emulatable (left for real-device dogfood, non-blocking):
// rubber-band overscroll feel, haptics, real iOS keyboard geometry,
// PWA install, multi-touch simultaneous drags.

import { test, expect } from '@playwright/test';
import { setupMockBackend } from './helpers/mock-backend.js';
import { BACKLOG_REGISTRY, BACKLOG_FIXTURES } from './fixtures/backlog-detail-fixtures.js';

test.describe('Phase 5b-10 mobile emulation — backlog modal on iPhone viewport', () => {

  // ─── M1 — Layout sanity at 390px ────────────────────────────────────
  test('M1 layout: modal fits iPhone viewport, no horizontal overflow, touch targets >= 44px', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');

    // Open via touch tap on the chevron (real touch event, not mouse).
    await page.getByTestId('board-project-chevron-lionmaker-systems').tap();
    await expect(page.getByTestId('backlog-modal-root')).toBeVisible();
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();

    // No horizontal overflow: document scrollWidth == viewport width.
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth
    }));
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.innerW);

    // Close button hit target >= 44x44 (iOS HIG).
    const closeBox = await page.getByTestId('backlog-modal-close').boundingBox();
    expect(closeBox.width).toBeGreaterThanOrEqual(44);
    expect(closeBox.height).toBeGreaterThanOrEqual(44);

    // Check/delete buttons >= 36px (wrap2-mode size per TaskRow
    // convention; full 44 would crowd the two-line rows).
    const checkBox = await page.getByTestId('backlog-task-check-t-lm-1').boundingBox();
    expect(checkBox.width).toBeGreaterThanOrEqual(36);
    expect(checkBox.height).toBeGreaterThanOrEqual(36);
  });

  // ─── M2 — Scroll geometry + handle touch-action ─────────────────────
  test('M2 scroll: modal body scrolls a 12-row list; drag handles carry touch-action none; text column does not', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    // mixed-height has 12 tasks — guaranteed to overflow the 844px
    // viewport so the scroll assertion is unconditional (Codex 5b-10:
    // the earlier 4-row fixture made it vacuous).
    await page.getByTestId('board-project-chevron-mixed-height').tap();
    await expect(page.getByTestId('backlog-task-mx-1')).toBeVisible();

    // Drag handle opts out of native scroll (touch-action: none) so
    // vertical finger movement reorders instead of scrolling — that is
    // the DESIGNED behavior on the handle (agenda #1's question is
    // whether the 32px rail makes scroll hard; structure verified
    // here, ergonomics remain a dogfood observation).
    const handleTouchAction = await page.getByTestId('backlog-task-drag-mx-1')
      .evaluate(el => getComputedStyle(el).touchAction);
    expect(handleTouchAction).toBe('none');

    // Task text column does NOT block native scroll — finger-scroll
    // starting on text must scroll the modal body.
    const textTouchAction = await page.getByTestId('backlog-task-text-mx-1')
      .evaluate(el => getComputedStyle(el).touchAction);
    expect(textTouchAction).not.toBe('none');

    // Modal body is the scroll container, overflows, and scrolls.
    const scrolled = await page.evaluate(() => {
      const body = document.querySelector('.backlog-modal-body');
      if (!body) return null;
      const before = body.scrollTop;
      body.scrollTop = 200;
      return { before, after: body.scrollTop, scrollable: body.scrollHeight > body.clientHeight };
    });
    expect(scrolled).not.toBeNull();
    expect(scrolled.before).toBe(0);
    expect(scrolled.scrollable).toBe(true);
    expect(scrolled.after).toBeGreaterThan(0);

    // Last filler row reachable by scroll.
    await page.evaluate(() => {
      const body = document.querySelector('.backlog-modal-body');
      body.scrollTop = body.scrollHeight;
    });
    await expect(page.getByTestId('backlog-task-mx-12')).toBeVisible();
  });

  // ─── M3 — Mixed-height drag accuracy (5b-10 drag.js fix) ────────────
  // Discriminating regression test: drag a SHORT row down to just past
  // a TALL (2-line) row's center. Old uniform-height math computed
  // offset = round(delta / shortRowHeight) which over-counted slots
  // when crossing taller rows (delta ~90px / 56px short height →
  // offset 2 → skipped a slot). Nearest-center math lands on the tall
  // row's slot → swap, not skip.
  test('M3 mixed-height drag: short row dragged past tall row lands ONE slot down, not two', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-mixed-height').tap();
    await expect(page.getByTestId('backlog-task-mx-1')).toBeVisible();

    // Confirm the tall row actually wrapped to 2 lines at this viewport
    // (taller than the short row) — otherwise the test isn't testing
    // mixed heights.
    const shortBox = await page.getByTestId('backlog-task-mx-1').boundingBox();
    const tallBox = await page.getByTestId('backlog-task-mx-2').boundingBox();
    expect(tallBox.height).toBeGreaterThan(shortBox.height + 10);

    // Drag mx-1 (short) down by (distance between row centers) + 10px —
    // just past the tall row's center, well short of mx-3's center.
    // Correct toIdx: 1 (swap with tall row). Old-math toIdx: 2 (skip).
    const handle = page.getByTestId('backlog-task-drag-mx-1');
    const hBox = await handle.boundingBox();
    const shortCenterY = shortBox.y + shortBox.height / 2;
    const tallCenterY = tallBox.y + tallBox.height / 2;
    const delta = (tallCenterY - shortCenterY) + 10;

    const startX = hBox.x + hBox.width / 2;
    const startY = hBox.y + hBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + delta, { steps: 12 });
    await page.mouse.up();

    // Reorder POST captured with the SWAP order leading (mx-2, mx-1,
    // mx-3, mx-4, ...) — not the skip order (mx-2, mx-3, mx-1, ...).
    // Full-list payload is all 12 ids; the discriminating signal is in
    // the first four.
    const reorderOps = capture.backlog.filter(b => b.op === 'reorder');
    expect(reorderOps).toHaveLength(1);
    expect(reorderOps[0].order).toHaveLength(12);
    expect(reorderOps[0].order.slice(0, 4)).toEqual(['mx-2', 'mx-1', 'mx-3', 'mx-4']);
  });

  // ─── M4 — Edit input stays visible (keyboard-occlusion defense) ─────
  test('M4 edit visibility: tapping text on the LAST row scrolls input into view', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').tap();
    await expect(page.getByTestId('backlog-task-t-lm-3')).toBeVisible();

    // Enter edit mode on the last row via touch tap.
    await page.getByTestId('backlog-task-text-t-lm-3').tap();
    const input = page.getByTestId('backlog-task-input-t-lm-3');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // After scrollIntoView({block:'center'}), the input must be inside
    // the viewport with margin — the defense that keeps it above an
    // iOS keyboard (~330px from the bottom on a real device).
    await page.waitForTimeout(450); // smooth scroll settle
    const inputBox = await input.boundingBox();
    expect(inputBox.y).toBeGreaterThanOrEqual(0);
    const viewportH = page.viewportSize().height;
    expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(viewportH);
  });

  // ─── M5 — Touch tap interactions: check + delete + close ────────────
  test('M5 touch ops: tap-check removes row, tap-delete removes row, tap-close returns to Board', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').tap();
    await expect(page.getByTestId('backlog-task-t-lm-2')).toBeVisible();

    await page.getByTestId('backlog-task-check-t-lm-2').tap();
    await expect(page.getByTestId('backlog-task-t-lm-2')).toHaveCount(0);

    await page.getByTestId('backlog-task-delete-t-lm-3').tap();
    await expect(page.getByTestId('backlog-task-t-lm-3')).toHaveCount(0);

    expect(capture.backlog.filter(b => b.op === 'complete')).toHaveLength(1);
    expect(capture.backlog.filter(b => b.op === 'delete_task')).toHaveLength(1);

    await page.getByTestId('backlog-modal-close').tap();
    await expect(page.getByTestId('backlog-modal-root')).toHaveCount(0);
    await expect(page.getByTestId('board-project-chevron-lionmaker-systems')).toBeVisible();
  });
});

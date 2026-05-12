// Phase 5a E2E — Board interactions (5a-8).
//
// Covers the Board surface work shipped in 5a-3 through 5a-7:
//   - Urgent-first sort + urgent_count header (5a-3, 5a-7)
//   - completeTask via ✓ button (5a-4 mutator + 5a-6 wiring)
//   - reorderTopThree via drag (5a-4 mutator + 5a-6 wiring + 5a-7 ProjectCard drag controller)
//   - toggleTaskUrgent via long-press (5a-4 mutator + 5a-6 wiring)
//   - launchTask via ▶ button (5a-5 helper + 5a-6 wiring)
//   - EXECUTE button → top-most task (5a-7 Board.jsx)
//   - Empty Board renders EmptyState, EXECUTE absent (5a-7 + Board.jsx allEmpty branch)
//
// Spec reference: vault/build/phase5a-spec.md § Test plan (7 tests).
// Mirrors onboard-flow.spec.js structure (test.describe + per-test
// setupMockBackend). No installMediaRecorderStub: Board has no mic.
// No drive-flow helpers: Board has no state machine — just goto +
// interact + assert.

import { test, expect } from '@playwright/test';
import { setupMockBackend } from './helpers/mock-backend.js';
import { POPULATED_REGISTRY, BOARD_EMPTY_TOP_REGISTRY } from './fixtures/populated-registry.js';

test.describe('Phase 5a Board — board-flow', () => {

  // ─── Test 1 — Render + urgent-first sort ─────────────────────────────
  test('1 render: top-3 per project, urgent rows above non-urgent', async ({ page }) => {
    await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    // Three project panels render.
    await expect(page.getByTestId('board-project-lionmaker-systems')).toBeVisible();
    await expect(page.getByTestId('board-project-708-pallister')).toBeVisible();
    await expect(page.getByTestId('board-project-motor-city-deals')).toBeVisible();

    // Lionmaker Systems top[0] is the urgent task (per fixture pre-sort
    // matching the backend's urgent-first sort from 5a-3).
    const lionmakerCard = page.getByTestId('board-project-lionmaker-systems');
    const urgentRow = lionmakerCard.getByTestId('board-task-t-lm-urgent');
    await expect(urgentRow).toBeVisible();
    await expect(urgentRow).toHaveClass(/\burgent\b/);

    // Header reads "1 URGENT / 3" per 5a-7 ProjectCard rewrite.
    await expect(lionmakerCard.locator('.urgent-count .n-urgent')).toHaveText('1 URGENT');
    // The total count "/ 3" lives as bare text after the slash span; the
    // .urgent-count span's full text covers both numbers.
    await expect(lionmakerCard.locator('.urgent-count')).toContainText('1 URGENT');
    await expect(lionmakerCard.locator('.urgent-count')).toContainText('3');

    // Non-urgent rows below the urgent one in fixture-order (priority 1, then 2).
    const rows = lionmakerCard.locator('.task-row');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).locator('.task-text')).toContainText('Address production blocker');
    await expect(rows.nth(1).locator('.task-text')).toContainText('Ship V2 onboarding');
    await expect(rows.nth(2).locator('.task-text')).toContainText('Write design doc');
  });

  // ─── Test 2 — Tap ✓ to complete ──────────────────────────────────────
  test('2 check-off: tap ✓ on non-urgent and urgent tasks; header counts track', async ({ page }) => {
    const capture = await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    const lionmakerCard = page.getByTestId('board-project-lionmaker-systems');

    // Complete a non-urgent task first ('Ship V2 onboarding' = t-lm-1).
    await page.getByTestId('board-task-check-t-lm-1').click();

    // POST captured with correct shape.
    const completeOps = capture.backlog.filter(b => b.op === 'complete');
    expect(completeOps).toHaveLength(1);
    expect(completeOps[0]).toMatchObject({
      op: 'complete',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-1'
    });

    // Row disappears optimistically; header decrements total (1 URGENT / 2).
    await expect(page.getByTestId('board-task-t-lm-1')).toHaveCount(0);
    await expect(lionmakerCard.locator('.urgent-count .n-urgent')).toHaveText('1 URGENT');
    await expect(lionmakerCard.locator('.urgent-count')).toContainText('2');

    // Now complete the urgent task. Header should decrement urgent_count too.
    await page.getByTestId('board-task-check-t-lm-urgent').click();

    const completeOpsAfter = capture.backlog.filter(b => b.op === 'complete');
    expect(completeOpsAfter).toHaveLength(2);
    expect(completeOpsAfter[1]).toMatchObject({
      op: 'complete',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-urgent'
    });

    // 0 URGENT / 1 after urgent_count delta from 5a-7's optimistic update.
    await expect(lionmakerCard.locator('.urgent-count .n-urgent')).toHaveText('0 URGENT');
    await expect(lionmakerCard.locator('.urgent-count')).toContainText('1');
  });

  // ─── Test 3 — Drag-reorder within a project's top-3 ──────────────────
  //
  // Attempts manual pointer sequence per phase5a-spec.md test plan.
  // R5b's onboard-flow.spec.js skipped drag tests citing Playwright
  // unreliability; 5a-8 explicitly attempts it here per advisor
  // directive. If this proves flaky in CI, fall back to skip with
  // R5b's precedent comment.
  test('3 drag-reorder within project top-3: op:reorder POST captured with new order', async ({ page }) => {
    const capture = await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    // Drag t-lm-1 (currently at top[1]) up to top[0] position. Expected
    // new order: [t-lm-1, t-lm-urgent, t-lm-2].
    const handle = page.getByTestId('board-task-drag-t-lm-1');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // mouse.move to handle, then down, then up by 80px in steps to cross
    // drag.js's 8px engage threshold AND produce offset = -1 (one slot up,
    // rowHeight ~72px for wrap2 rows).
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 80, { steps: 10 });
    await page.mouse.up();

    const reorderOps = capture.backlog.filter(b => b.op === 'reorder');
    expect(reorderOps).toHaveLength(1);
    expect(reorderOps[0]).toMatchObject({
      op: 'reorder',
      project_id: 'lionmaker-systems',
      order: ['t-lm-1', 't-lm-urgent', 't-lm-2']
    });

    // DOM reflects the new order (optimistic update).
    const lionmakerCard = page.getByTestId('board-project-lionmaker-systems');
    const rows = lionmakerCard.locator('.task-row');
    await expect(rows.nth(0).locator('.task-text')).toContainText('Ship V2 onboarding');
    await expect(rows.nth(1).locator('.task-text')).toContainText('Address production blocker');
    await expect(rows.nth(2).locator('.task-text')).toContainText('Write design doc');
  });

  // ─── Test 4 — Long-press for urgent toggle ───────────────────────────
  test('4 long-press: toggle urgent on a non-urgent task; header increments', async ({ page }) => {
    const capture = await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    const pallisterCard = page.getByTestId('board-project-708-pallister');

    // Verify initial state: 0 urgent on 708-pallister.
    await expect(pallisterCard.locator('.urgent-count .n-urgent')).toHaveText('0 URGENT');

    // Long-press on the non-urgent task's text element. Mirrors R5b's
    // long-press pattern from onboard-flow.spec.js test 10.
    const textEl = page.getByTestId('board-task-text-t-pall-1');
    const box = await textEl.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();

    // POST captured with correct shape.
    const toggleOps = capture.backlog.filter(b => b.op === 'toggle_urgent');
    expect(toggleOps).toHaveLength(1);
    expect(toggleOps[0]).toMatchObject({
      op: 'toggle_urgent',
      project_id: '708-pallister',
      task_id: 't-pall-1',
      urgent: true
    });

    // Row now has .urgent class; header now reads "1 URGENT / 1".
    await expect(page.getByTestId('board-task-t-pall-1')).toHaveClass(/\burgent\b/);
    await expect(pallisterCard.locator('.urgent-count .n-urgent')).toHaveText('1 URGENT');
  });

  // ─── Test 5 — Tap ▶ to launch into Focus ─────────────────────────────
  test('5 launch: tap ▶ mounts Focus with task text; back returns to Board', async ({ page }) => {
    await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    // Click ▶ on the urgent lionmaker task.
    await page.getByTestId('board-task-launch-t-lm-urgent').click();

    // Focus mounts.
    await expect(page.getByTestId('focus-root')).toBeVisible();
    await expect(page.getByTestId('focus-root')).toContainText('Address production blocker');

    // Board no longer in DOM (App.jsx render switch).
    await expect(page.getByTestId('board-task-t-lm-urgent')).toHaveCount(0);

    // Back to Board.
    await page.getByTestId('focus-back').click();
    await expect(page.getByTestId('focus-root')).toHaveCount(0);
    await expect(page.getByTestId('board-task-t-lm-urgent')).toBeVisible();
  });

  // ─── Test 6 — Tap EXECUTE to launch top-most task ────────────────────
  test('6 execute: tap EXECUTE mounts Focus with summary[0].top[0] task', async ({ page }) => {
    await setupMockBackend(page, { registry: POPULATED_REGISTRY });
    await page.goto('/');

    // EXECUTE button visible (POPULATED has non-empty tops).
    await expect(page.getByTestId('board-execute')).toBeVisible();
    await page.getByTestId('board-execute').click();

    // Focus mounts with the urgent lionmaker task — first project (priority
    // 1) AND first row after urgent-first sort.
    await expect(page.getByTestId('focus-root')).toBeVisible();
    await expect(page.getByTestId('focus-root')).toContainText('Address production blocker');
  });

  // ─── Test 7 — Empty Board: EmptyState renders, no EXECUTE ────────────
  test('7 empty board: EmptyState visible, board-execute not in DOM', async ({ page }) => {
    // BOARD_EMPTY_TOP_REGISTRY: summary has one project, top[] empty.
    // Triggers Board.jsx's allEmpty branch (every project has empty top)
    // but NOT App.jsx's useAutoOnboard (summary not empty).
    await setupMockBackend(page, { registry: BOARD_EMPTY_TOP_REGISTRY });
    await page.goto('/');

    // EmptyState visible.
    await expect(page.getByTestId('board-empty-state')).toBeVisible();
    await expect(page.getByTestId('board-empty-state')).toContainText('AWAITING INPUT');

    // EXECUTE button NOT in DOM — Board.jsx allEmpty branch returns early
    // before reaching the EXECUTE render. (Per 5a-7's topMostTask helper
    // pattern, EXECUTE only renders when there's a task to launch.)
    await expect(page.getByTestId('board-execute')).toHaveCount(0);

    // Project panel not rendered in the allEmpty branch either.
    await expect(page.getByTestId('board-project-empty-project')).toHaveCount(0);
  });
});

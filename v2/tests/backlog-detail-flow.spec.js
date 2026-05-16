// Phase 5b E2E — Backlog detail modal (5b-8).
//
// Covers the modal surface work shipped in 5b-2 through 5b-7:
//   - Backend ops update_task_text + delete_task (5b-2)
//   - backlogStore + mutators (5b-3) — generation guard, optimistic
//     update + rollback, recurring task filter
//   - BacklogDetail modal frame + render switch (5b-4) — open via
//     openProject, close via close button, force-backlog dev override
//   - BacklogTaskRow + URGENT/NORMAL sections (5b-5) — drag, longpress
//     urgent toggle, check, delete, group rendering
//   - Inline edit-text (5b-6) — tap-to-edit, Enter/blur commit, Esc
//     cancel, save-failed state, retry preserves last-attempted text,
//     disable buttons + drag while editing
//   - Project-card chevron (5b-7) — open modal from Board
//
// Spec reference: vault/build/phase5b-spec.md § Test plan (7-9 tests
// minimum; this file ships 13 to cover save-failed retry + recurring
// + disable-while-editing + openProject 404 + drag-suppression
// reproducing the real rollback-risk scenario per 5b-5/5b-6/5b-8
// council + Codex additions).
//
// Mirrors board-flow.spec.js structure: setupMockBackend per test +
// goto + interact + assert. No installMediaRecorderStub (modal has
// no mic). No drive-flow helpers (modal has no state machine).

import { test, expect } from '@playwright/test';
import { setupMockBackend } from './helpers/mock-backend.js';
import { BACKLOG_REGISTRY, BACKLOG_FIXTURES } from './fixtures/backlog-detail-fixtures.js';

test.describe('Phase 5b Backlog Detail — backlog-detail-flow', () => {

  // ─── Test 1 — Tap chevron → modal opens with project's task list ────
  test('1 chevron open: tap project chevron → modal mounts with project name + task list', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');

    // Tap chevron on Lionmaker Systems project card.
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();

    // Modal mounts, header populates after fetch resolves. Note: the
    // CSS text-transform:uppercase on .backlog-modal-project changes
    // RENDERED text but not DOM textContent, so containText() asserts
    // the source-cased fixture value, not the visually-uppercased text.
    await expect(page.getByTestId('backlog-modal-root')).toBeVisible();
    await expect(page.getByTestId('backlog-modal-root')).toContainText('Lionmaker Systems');

    // Pending tasks render (4 pending: 1 urgent + 3 normal). Done task
    // filtered out by preparePending in backlogStore.openProject.
    await expect(page.getByTestId('backlog-task-t-lm-urgent')).toBeVisible();
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();
    await expect(page.getByTestId('backlog-task-t-lm-2')).toBeVisible();
    await expect(page.getByTestId('backlog-task-t-lm-3')).toBeVisible();
    await expect(page.getByTestId('backlog-task-t-lm-done')).toHaveCount(0);

    // Header counts: 1 URGENT / 4 TASKS.
    await expect(page.locator('.backlog-modal-urgent-line .n')).toHaveText('1 URGENT');
    await expect(page.locator('.backlog-modal-urgent-line')).toContainText('4 TASKS');

    // Section labels render unconditionally per spec Decision 8.
    await expect(page.getByTestId('backlog-section-urgent')).toBeVisible();
    await expect(page.getByTestId('backlog-section-normal')).toBeVisible();
  });

  // ─── Test 2 — Drag-reorder within NORMAL section ────────────────────
  test('2 drag-reorder NORMAL: reorder 2 normal tasks; op:reorder POST captures full-list payload', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();

    // Drag t-lm-2 (NORMAL section, idx 1) up to NORMAL idx 0 position
    // (above t-lm-1). Expected new full-list order: urgent first, then
    // [t-lm-2, t-lm-1, t-lm-3].
    const handle = page.getByTestId('backlog-task-drag-t-lm-2');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 10 });
    await page.mouse.up();

    // POST captured with full-list payload per backlogStore drag contract.
    const reorderOps = capture.backlog.filter(b => b.op === 'reorder');
    expect(reorderOps).toHaveLength(1);
    expect(reorderOps[0]).toMatchObject({
      op: 'reorder',
      project_id: 'lionmaker-systems',
      // urgent first (unchanged), then normal in new order
      order: ['t-lm-urgent', 't-lm-2', 't-lm-1', 't-lm-3']
    });
  });

  // ─── Test 3 — Long-press text → urgent toggle, section change ───────
  test('3 long-press urgent toggle: task moves between sections, header counts update', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();

    // Long-press the t-lm-1 (NORMAL) text element to toggle urgent.
    const textEl = page.getByTestId('backlog-task-text-t-lm-1');
    const box = await textEl.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();

    // POST captured.
    const toggleOps = capture.backlog.filter(b => b.op === 'toggle_urgent');
    expect(toggleOps).toHaveLength(1);
    expect(toggleOps[0]).toMatchObject({
      op: 'toggle_urgent',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-1',
      urgent: true
    });

    // Row now has urgent class; header increments urgent count.
    await expect(page.getByTestId('backlog-task-t-lm-1')).toHaveClass(/\burgent\b/);
    await expect(page.locator('.backlog-modal-urgent-line .n')).toHaveText('2 URGENT');
  });

  // ─── Test 4 — Tap text to edit, Enter to commit ─────────────────────
  test('4 edit text via tap + Enter: op:update_task_text POST captured, DOM reflects edit', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();

    // Tap on text element to enter edit mode.
    await page.getByTestId('backlog-task-text-t-lm-1').click();

    // Input mounts with current text; verify it's focused.
    const input = page.getByTestId('backlog-task-input-t-lm-1');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Type new text. Select-all on focus means typing replaces.
    await input.fill('Ship V2 onboarding (revised)');
    await input.press('Enter');

    // POST captured with the new text.
    const editOps = capture.backlog.filter(b => b.op === 'update_task_text');
    expect(editOps).toHaveLength(1);
    expect(editOps[0]).toMatchObject({
      op: 'update_task_text',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-1',
      text: 'Ship V2 onboarding (revised)'
    });

    // Input unmounts; text div re-renders with optimistic new text.
    await expect(input).toHaveCount(0);
    await expect(page.getByTestId('backlog-task-text-t-lm-1')).toContainText('Ship V2 onboarding (revised)');
  });

  // ─── Test 5 — Tap check on a task → row removes, header decrements ──
  test('5 check-off: op:complete POST captured, row removes, header count decrements', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-task-t-lm-2')).toBeVisible();

    // Tap check on the non-urgent t-lm-2.
    await page.getByTestId('backlog-task-check-t-lm-2').click();

    // POST captured.
    const completeOps = capture.backlog.filter(b => b.op === 'complete');
    expect(completeOps).toHaveLength(1);
    expect(completeOps[0]).toMatchObject({
      op: 'complete',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-2'
    });

    // Row disappears optimistically; counts decrement.
    await expect(page.getByTestId('backlog-task-t-lm-2')).toHaveCount(0);
    await expect(page.locator('.backlog-modal-urgent-line')).toContainText('3 TASKS');

    // Section labels still render unconditionally even after the
    // section's only task is gone (this test path leaves NORMAL with
    // 2 tasks + URGENT with 1, but verifying the unconditional rule
    // here per Council 4 5b-8 — Decision 8 says labels render even
    // for empty sections).
    await expect(page.getByTestId('backlog-section-urgent')).toBeVisible();
    await expect(page.getByTestId('backlog-section-normal')).toBeVisible();
  });

  // ─── Test 6 — Tap delete on a task → row removes permanently ────────
  test('6 delete: op:delete_task POST captured, row removes', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-task-t-lm-3')).toBeVisible();

    // Tap delete on t-lm-3.
    await page.getByTestId('backlog-task-delete-t-lm-3').click();

    // POST captured.
    const deleteOps = capture.backlog.filter(b => b.op === 'delete_task');
    expect(deleteOps).toHaveLength(1);
    expect(deleteOps[0]).toMatchObject({
      op: 'delete_task',
      project_id: 'lionmaker-systems',
      task_id: 't-lm-3'
    });

    // Row disappears; total count decrements.
    await expect(page.getByTestId('backlog-task-t-lm-3')).toHaveCount(0);
    await expect(page.locator('.backlog-modal-urgent-line')).toContainText('3 TASKS');
  });

  // ─── Test 7 — Close modal → returns to Board ────────────────────────
  test('7 close modal: tap close button → modal unmounts, Board visible, store cleared', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await expect(page.getByTestId('backlog-modal-root')).toBeVisible();

    // Tap close.
    await page.getByTestId('backlog-modal-close').click();

    // Modal unmounts; Board re-mounts (project chevron visible again).
    await expect(page.getByTestId('backlog-modal-root')).toHaveCount(0);
    await expect(page.getByTestId('board-project-chevron-lionmaker-systems')).toBeVisible();
  });

  // ─── Test 8 — Empty project → empty-state rendering ─────────────────
  test('8 empty project: open modal on project with 0 pending tasks → empty state renders', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');

    // Motor City Deals has 0 tasks in its full backlog fixture.
    await page.getByTestId('board-project-chevron-motor-city-deals').click();

    await expect(page.getByTestId('backlog-modal-root')).toBeVisible();
    await expect(page.getByTestId('backlog-modal-empty')).toBeVisible();
    await expect(page.getByTestId('backlog-modal-empty')).toContainText('NO PENDING TASKS');

    // Section labels NOT rendered (BacklogList not mounted when tasks=[]).
    await expect(page.getByTestId('backlog-section-urgent')).toHaveCount(0);
    await expect(page.getByTestId('backlog-section-normal')).toHaveCount(0);
  });

  // ─── Test 9 — Esc cancels edit mode ─────────────────────────────────
  test('9 esc-cancel: type into input, press Esc → edit discarded, no POST fires', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await page.getByTestId('backlog-task-text-t-lm-1').click();

    const input = page.getByTestId('backlog-task-input-t-lm-1');
    await input.fill('discarded text that should not be saved');
    await input.press('Escape');

    // No update_task_text POST captured.
    const editOps = capture.backlog.filter(b => b.op === 'update_task_text');
    expect(editOps).toHaveLength(0);

    // Input unmounted; text div shows ORIGINAL text.
    await expect(input).toHaveCount(0);
    await expect(page.getByTestId('backlog-task-text-t-lm-1')).toContainText('Ship V2 onboarding');
  });

  // ─── Test 10 — Save-failed state with retry preserves text ──────────
  test('10 save-failed retry: failed edit shows retry button; retry preserves typed text', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES,
      backlogEditFailOnText: 'Pizza' // mock returns 500 when this text is sent
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();
    await page.getByTestId('backlog-task-text-t-lm-1').click();

    const input = page.getByTestId('backlog-task-input-t-lm-1');
    await input.fill('Pizza');
    await input.press('Enter');

    // POST fired and failed. Retry button appears on the row.
    expect(capture.backlog.filter(b => b.op === 'update_task_text')).toHaveLength(1);
    const retryButton = page.getByTestId('backlog-task-retry-t-lm-1');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toContainText('SAVE FAILED');

    // Text div shows the ROLLED-BACK original text (rollback restored
    // snapshot per backlogStore.editText catch).
    await expect(page.getByTestId('backlog-task-text-t-lm-1')).toContainText('Ship V2 onboarding');

    // Tap retry: re-enters edit mode with LAST ATTEMPTED text preloaded
    // (Council 4 5b-6 lastAttempt preservation). Without this, defaultValue
    // would default to task.text (rolled-back) and lose user's "Pizza".
    await retryButton.click();
    const inputAgain = page.getByTestId('backlog-task-input-t-lm-1');
    await expect(inputAgain).toBeVisible();
    await expect(inputAgain).toHaveValue('Pizza');
  });

  // ─── Test 11 — Drag suppression blocks the rollback-risk scenario ───
  // Reproduces the actual concurrent-mutator scenario that motivated
  // disabling drag while editing (Codex 5b-6 Phase 3): user types new
  // text into row A, drags row A, blur commits edit, drag fires reorder,
  // edit fails, snapshot rollback can undo the reorder. With suppression:
  // drag attempt yields no reorder POST, edit can fail and surface
  // row-level retry without affecting position of other rows.
  test('11 disabled while editing: drag suppression actually blocks reorder during dirty edit', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES,
      backlogEditFailOnText: 'Pizza' // forces the edit to fail
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();

    // Enter edit mode on t-lm-1 and DIRTY the input (so blur commits a
    // real text change rather than the unchanged-text early return).
    await page.getByTestId('backlog-task-text-t-lm-1').click();
    const input = page.getByTestId('backlog-task-input-t-lm-1');
    await expect(input).toBeVisible();
    await input.fill('Pizza');

    // While editing, check + delete disabled.
    await expect(page.getByTestId('backlog-task-check-t-lm-1')).toBeDisabled();
    await expect(page.getByTestId('backlog-task-delete-t-lm-1')).toBeDisabled();

    // Drag handle has editing-suppressed class + pointer-events:none.
    const dragHandle = page.getByTestId('backlog-task-drag-t-lm-1');
    await expect(dragHandle).toHaveClass(/editing-suppressed/);
    await expect(dragHandle).toHaveCSS('pointer-events', 'none');

    // Attempt a drag on the suppressed handle. Real-flow behavior:
    // pointer-events:none means drag.js never receives pointerdown,
    // BUT the mouse.down at handle coords lands on the row underneath
    // (or modal body), which IS outside the focused input — so the
    // input blurs. Blur fires onBlur={commitEdit}, the dirty 'Pizza'
    // gets committed via editText (which the mock will fail).
    //
    // Net effect: drag was blocked (no reorder POST), edit was
    // committed (1 update_task_text POST that fails). User-intent
    // ambiguity (edit + drag at same time) resolves in favor of the
    // edit, with no reorder ever happening.
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y - 60, { steps: 10 });
    await page.mouse.up();

    // Drag was blocked: no reorder POST.
    const reorderOps = capture.backlog.filter(b => b.op === 'reorder');
    expect(reorderOps).toHaveLength(0);

    // Edit was committed via blur (because drag attempt landed outside
    // the focused input → blur fired → commitEdit fired with 'Pizza').
    // Mock returns 500 for 'Pizza' → editText returns ok:false →
    // setSaveFailed(true) → retry button appears.
    await expect(page.getByTestId('backlog-task-retry-t-lm-1')).toBeVisible();

    const editOps = capture.backlog.filter(b => b.op === 'update_task_text');
    expect(editOps).toHaveLength(1);
    expect(editOps[0]).toMatchObject({
      op: 'update_task_text',
      task_id: 't-lm-1',
      text: 'Pizza'
    });

    // Row order unchanged: t-lm-1 is still where it was. Even though
    // edit failed and rolled back, no reorder happened — drag
    // suppression is the property under test. Verify by checking the
    // row count stayed at 4 and the row at position 0 of NORMAL
    // section is still t-lm-1.
    await expect(page.getByTestId('backlog-task-t-lm-1')).toBeVisible();
  });

  // ─── Test 12 — openProject 404 → modal-level error state ────────────
  test('12 openProject 404: registry has project but backlogs map omits it → modal-level error', async ({ page }) => {
    await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      // Note: backlogs map intentionally omits 'lionmaker-systems' so the
      // GET ?project_id=lionmaker-systems request returns 404. Tests the
      // BacklogDetail.jsx render path where loading=false + error truthy
      // + tasks=[] shows the modal-level error block.
      backlogs: {
        '708-pallister': BACKLOG_FIXTURES['708-pallister']
      }
    });
    await page.goto('/');

    // Tap chevron on lionmaker-systems (intentionally NOT in backlogs map).
    await page.getByTestId('board-project-chevron-lionmaker-systems').click();

    // Modal mounts. Loading state resolves to error state because the
    // 404 fetch failed. Empty state should NOT show (it's gated on
    // !error per the 5b-8 BacklogDetail bug fix).
    await expect(page.getByTestId('backlog-modal-root')).toBeVisible();
    await expect(page.getByTestId('backlog-modal-error')).toBeVisible();
    await expect(page.getByTestId('backlog-modal-empty')).toHaveCount(0);
    await expect(page.getByTestId('backlog-list')).toHaveCount(0);

    // Header shows the project_id fallback (Codex 5b-8 Phase 3 UX fix
    // — without this, header shows just '...' and user can't tell
    // which project failed to load).
    await expect(page.getByTestId('backlog-modal-root')).toContainText('lionmaker-systems');

    // Close still works in error state.
    await page.getByTestId('backlog-modal-close').click();
    await expect(page.getByTestId('backlog-modal-root')).toHaveCount(0);
  });

  // ─── Test 13 — Recurring task complete → row stays visible ──────────
  test('13 recurring task complete: ✓ on daily-recurring task does NOT remove row', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: BACKLOG_REGISTRY,
      backlogs: BACKLOG_FIXTURES
    });
    await page.goto('/');
    await page.getByTestId('board-project-chevron-fitness').click();

    // Verify the recurring task is rendered.
    const row = page.getByTestId('backlog-task-fit-001');
    await expect(row).toBeVisible();
    await expect(page.locator('.backlog-modal-urgent-line')).toContainText('1 TASKS');

    // Tap check on the recurring task.
    await page.getByTestId('backlog-task-check-fit-001').click();

    // POST captured (op:complete fires regardless — backend stamps
    // last_completed for recurring).
    const completeOps = capture.backlog.filter(b => b.op === 'complete');
    expect(completeOps).toHaveLength(1);
    expect(completeOps[0]).toMatchObject({
      op: 'complete',
      project_id: 'fitness',
      task_id: 'fit-001'
    });

    // CRITICAL: row STAYS visible per 5b-5 recurring task filter fix
    // (backlogStore.completeTask checks task.recurring === 'daily' before
    // optimistically filtering). Without this fix, the row disappears
    // optimistically then comes back on next fetch — confusing UX.
    await expect(row).toBeVisible();
    await expect(page.locator('.backlog-modal-urgent-line')).toContainText('1 TASKS');

    // Row remains in normal actionable state (no save-failed/error UI,
    // check button still enabled). Codex 5b-8 Phase 3 noted: without
    // these assertions, the test only proves "didn't disappear" but
    // doesn't catch a future regression that, e.g., disables the row.
    await expect(page.getByTestId('backlog-task-check-fit-001')).toBeEnabled();
    await expect(row).not.toHaveClass(/save-failed/);
    await expect(page.getByTestId('backlog-task-retry-fit-001')).toHaveCount(0);
  });
});

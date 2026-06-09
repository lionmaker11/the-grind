// Phase 6 E2E — Focus surface + Ring timer + pomodoro session.
//
// Covers phase6-spec.md's test plan: launch picker, work/pause/resume,
// skip chains, mode tabs, reset, leave-and-return (session survives
// Board), session replacement, localStorage persistence across reload,
// ring progress geometry, and full segment auto-advance via
// Playwright's clock API (fake Date.now + timers — the 25-minute work
// segment fast-forwards instead of waiting).
//
// Clock notes: page.clock.install() must precede page.goto. The timer
// derives timeLeft from endTimestamp - Date.now() and ticks on a 250ms
// interval, so fastForward() advances both the wall clock and the
// interval queue deterministically.

import { test, expect } from '@playwright/test';
import { setupMockBackend } from './helpers/mock-backend.js';
import { POPULATED_REGISTRY } from './fixtures/populated-registry.js';

async function launchIntoPicker(page) {
  await setupMockBackend(page, { registry: POPULATED_REGISTRY });
  await page.goto('/');
  await page.getByTestId('board-task-launch-t-lm-urgent').click();
  await expect(page.getByTestId('focus-root')).toBeVisible();
  await expect(page.getByTestId('pomo-picker')).toBeVisible();
}

test.describe('Phase 6 Focus — focus-flow', () => {

  // ─── F1 — Launch → picker → start 2-pomo session ────────────────────
  test('F1 picker: launch shows 4 glyphs; tap 2 starts work at 25:00 with 2 dots', async ({ page }) => {
    await launchIntoPicker(page);

    // 4 glyph buttons.
    for (const n of [1, 2, 3, 4]) {
      await expect(page.getByTestId(`pomo-pick-${n}`)).toBeVisible();
    }

    await page.getByTestId('pomo-pick-2').click();

    // Work mode: ring at 25:00, FOCUS label, 2 session dots (0 filled).
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');
    await expect(page.getByTestId('ring-time')).toHaveText('25:00');
    await expect(page.getByTestId('ring-label')).toHaveText('// FOCUS');
    const dots = page.getByTestId('session-dots').locator('.session-dot');
    await expect(dots).toHaveCount(2);
    await expect(page.getByTestId('session-dots').locator('.session-dot.filled')).toHaveCount(0);

    // Ambient gradient carries the work tint.
    await expect(page.locator('.bg-gradient')).toHaveClass(/\bwork\b/);
  });

  // ─── F2 — Pause / resume + TopBar status ────────────────────────────
  test('F2 pause/resume: PAUSE flips to RESUME; TopBar shows POMO 1 / 2 :: PAUSED', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();

    // Running: TopBar shows POMO 1 / 2 (TopBar overlays Focus at z-100).
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 1 / 2');

    await page.getByTestId('focus-primary').click(); // PAUSE
    await expect(page.getByTestId('focus-primary')).toHaveText('RESUME');
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 1 / 2 :: PAUSED');
    await expect(page.getByTestId('ring-label')).toHaveText('// PAUSED_');

    await page.getByTestId('focus-primary').click(); // RESUME
    await expect(page.getByTestId('focus-primary')).toHaveText('PAUSE');
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 1 / 2');
  });

  // ─── F3 — Skip work → break; dot fills ──────────────────────────────
  test('F3 skip: ⏭ during work counts the pomo and starts BREAK at 05:00', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();

    await page.getByTestId('focus-skip').click();

    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'break');
    await expect(page.getByTestId('ring-time')).toHaveText('05:00');
    await expect(page.getByTestId('ring-label')).toHaveText('// BREAK');
    await expect(page.getByTestId('focus-task-line')).toContainText('Step away');
    await expect(page.getByTestId('session-dots').locator('.session-dot.filled')).toHaveCount(1);
    // Primary is SKIP during break.
    await expect(page.getByTestId('focus-primary')).toHaveText('SKIP');
    await expect(page.locator('.bg-gradient')).toHaveClass(/\bbreak\b/);
  });

  // ─── F4 — Final work segment → REBOOT (long-break) ──────────────────
  test('F4 reboot: skipping through a 1-pomo session reaches REBOOT with CYCLE COMPLETE', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-1').click();

    // 1 planned pomo: skipping work goes straight to long-break.
    await page.getByTestId('focus-skip').click();

    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'long-break');
    await expect(page.getByTestId('ring-time')).toHaveText('15:00');
    await expect(page.getByTestId('ring-label')).toHaveText('// REBOOT');
    await expect(page.getByTestId('focus-proj-line')).toContainText('CYCLE COMPLETE');
    // Reboot shows all dots filled magenta-style.
    await expect(page.getByTestId('session-dots').locator('.session-dot.filled.reboot')).toHaveCount(1);
    await expect(page.locator('.bg-gradient')).toHaveClass(/long-break/);

    // Skipping the reboot completes the session → back on Board.
    await page.getByTestId('focus-skip').click();
    await expect(page.getByTestId('focus-root')).toHaveCount(0);
    await expect(page.getByTestId('board-task-t-lm-urgent')).toBeVisible();
  });

  // ─── F5 — Mode tabs switch segment type ─────────────────────────────
  test('F5 mode tabs: BREAK tab during work switches to break WITHOUT filling a dot', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();

    await page.getByTestId('mode-tab-break').click();
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'break');
    await expect(page.getByTestId('ring-time')).toHaveText('05:00');
    // Tab switch is not a completed work segment.
    await expect(page.getByTestId('session-dots').locator('.session-dot.filled')).toHaveCount(0);

    await page.getByTestId('mode-tab-focus').click();
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');
    await expect(page.getByTestId('ring-time')).toHaveText('25:00');
  });

  // ─── F6 — Leave to Board, session persists, re-enter ────────────────
  test('F6 leave/return: ← BOARD keeps session; TopBar shows POMO; relaunching same task re-enters', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-3').click();

    await page.getByTestId('focus-back').click();
    await expect(page.getByTestId('focus-root')).toHaveCount(0);
    await expect(page.getByTestId('board-task-t-lm-urgent')).toBeVisible();
    // Session still alive in TopBar.
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 1 / 3');

    // Relaunch the SAME task: re-enters the running session (no picker).
    await page.getByTestId('board-task-launch-t-lm-urgent').click();
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');
    await expect(page.getByTestId('pomo-picker')).toHaveCount(0);
    await expect(page.getByTestId('session-dots').locator('.session-dot')).toHaveCount(3);
  });

  // ─── F7 — Launching a different task replaces the session ───────────
  test('F7 replace: launching a DIFFERENT task lands in the picker (old session dropped)', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();
    await page.getByTestId('focus-back').click();

    // Launch a different project's task.
    await page.getByTestId('board-task-launch-t-pall-1').click();
    await expect(page.getByTestId('focus-root')).toBeVisible();
    await expect(page.getByTestId('pomo-picker')).toBeVisible();
    await expect(page.getByTestId('focus-task-line')).toContainText('Reconcile April invoice');
  });

  // ─── F8 — Back from the picker cancels the unstarted session ────────
  test('F8 picker cancel: ← BOARD from select mode leaves no session (clock in TopBar)', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('focus-back').click();
    await expect(page.getByTestId('focus-root')).toHaveCount(0);
    // No POMO status — clock format (DAY · HH:MM).
    await expect(page.getByTestId('topbar-status')).not.toContainText('POMO');
  });

  // ─── F9 — Ring progress geometry ─────────────────────────────────────
  test('F9 ring: progress dashoffset ~0 at full time; advances after fast-forward', async ({ page }) => {
    await page.clock.install();
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();

    const progress = page.getByTestId('ring-progress');
    const initial = parseFloat(await progress.getAttribute('stroke-dashoffset'));
    expect(initial).toBeLessThan(2); // full ring at 25:00

    // 12.5 minutes — halfway through the work segment.
    await page.clock.fastForward('12:30');
    await expect(page.getByTestId('ring-time')).toHaveText('12:30');
    const half = parseFloat(await progress.getAttribute('stroke-dashoffset'));
    expect(half).toBeGreaterThan(330); // ~339 = half of 678.58
    expect(half).toBeLessThan(350);
  });

  // ─── F10 — Auto-advance: work completes → break starts ──────────────
  test('F10 auto-advance: clock past 25:00 → BREAK auto-starts; past break → next work', async ({ page }) => {
    await page.clock.install();
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();

    await page.clock.fastForward('25:01');
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'break');
    await expect(page.getByTestId('session-dots').locator('.session-dot.filled')).toHaveCount(1);

    await page.clock.fastForward('05:01');
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 2 / 2');
  });

  // ─── F11 — Persistence across reload ────────────────────────────────
  test('F11 persistence: reload mid-work restores the session from localStorage', async ({ page }) => {
    await launchIntoPicker(page);
    await page.getByTestId('pomo-pick-2').click();
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');

    // Reload. The timer hydrates from localStorage; focusStore is
    // in-memory only, so the user lands on Board with the session
    // alive in the TopBar (same as leaving via ← BOARD).
    await page.reload();
    await expect(page.getByTestId('topbar-status')).toHaveText('POMO 1 / 2');

    // Re-entering via the same task resumes the running session.
    await page.getByTestId('board-task-launch-t-lm-urgent').click();
    await expect(page.getByTestId('focus-root')).toHaveAttribute('data-mode', 'work');
    await expect(page.getByTestId('pomo-picker')).toHaveCount(0);
  });
});

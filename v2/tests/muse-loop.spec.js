// Phase 3 E2E — voice loop closure.
//
// Mocks all /api/* calls so no network credentials are required. Stubs
// MediaRecorder + getUserMedia so the mic tap produces a deterministic blob.
// Verifies: tap FAB -> sheet opens -> tap mic -> mic active -> stop ->
// transcript populates input -> auto-send -> muse reply -> tool call
// dispatched -> backlog re-fetched -> new task appears on Board.

import { test, expect } from '@playwright/test';

const INITIAL_BOARD = {
  summary: [
    {
      project_id: 'lionmaker',
      project_name: 'LIONMAKER',
      task_count: 1,
      last_touched: new Date().toISOString(),
      top: [
        {
          id: 'task_existing_1',
          text: 'review Q2 roadmap',
          priority: 2,
          category: 'deep'
        }
      ]
    }
  ]
};

const AFTER_BOARD = {
  summary: [
    {
      project_id: 'lionmaker',
      project_name: 'LIONMAKER',
      task_count: 2,
      last_touched: new Date().toISOString(),
      top: [
        {
          id: 'task_existing_1',
          text: 'review Q2 roadmap',
          priority: 2,
          category: 'deep'
        },
        {
          id: 'task_new_1',
          text: 'call the lawyer about the contract',
          priority: 3,
          category: 'ops'
        }
      ]
    }
  ]
};

test.beforeEach(async ({ page }) => {
  // ── Stub MediaRecorder + getUserMedia before any script runs ─────────
  await page.addInitScript(() => {
    const fakeStream = {
      getTracks: () => [{ stop: () => {} }]
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => fakeStream
      }
    });

    class FakeMediaRecorder {
      constructor() {
        this.state = 'inactive';
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
      }
      static isTypeSupported() { return true; }
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
        const blob = new Blob([bytes], { type: 'audio/webm' });
        queueMicrotask(() => {
          if (this.ondataavailable) this.ondataavailable({ data: blob });
          if (this.onstop) this.onstop();
        });
      }
    }
    window.MediaRecorder = FakeMediaRecorder;
  });

  // ── API route mocks ──────────────────────────────────────────────────
  let boardState = INITIAL_BOARD;
  let chiefCalls = 0;

  await page.route('**/api/backlog', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(boardState)
      });
      return;
    }
    if (req.method() === 'POST') {
      // tool-call dispatch from the frontend — flip to AFTER_BOARD so the
      // next GET returns the new task.
      boardState = AFTER_BOARD;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, task_id: 'task_new_1' })
      });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/transcribe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: 'call the lawyer about the contract' })
    });
  });

  await page.route('**/api/chief', async (route) => {
    chiefCalls++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: 'On it.',
        actions: [
          {
            type: 'add_to_backlog',
            project_id: 'lionmaker',
            text: 'call the lawyer about the contract',
            priority: 3,
            category: 'ops'
          }
        ],
        meta: { chiefCalls }
      })
    });
  });
});

test('muse voice loop — mic tap to task on board', async ({ page }) => {
  await page.goto('/');

  // Board loads existing task
  await expect(page.getByText('review Q2 roadmap')).toBeVisible();

  // 1. Tap Muse FAB -> sheet opens
  await page.getByTestId('muse-fab').click();
  await expect(page.getByTestId('muse-sheet')).toBeVisible();
  await expect(page.getByTestId('muse-greeting')).toBeVisible();

  // 2. Tap mic -> recording
  await page.getByTestId('muse-mic').click();
  await expect(page.getByTestId('muse-mic')).toHaveClass(/recording/);

  // 3. Tap mic again -> stop + transcribe
  await page.getByTestId('muse-mic').click();

  // Transcript appears in input
  const input = page.getByTestId('muse-input');
  await expect(input).toHaveValue('call the lawyer about the contract');

  // 4. 800ms auto-send fires -> user bubble appears
  await expect(page.getByTestId('muse-bubble-user')).toHaveText(
    'call the lawyer about the contract',
    { timeout: 5_000 }
  );

  // 5. Muse reply bubble
  await expect(page.getByTestId('muse-bubble-muse')).toHaveText('On it.');

  // 6. Action bubble for the tool call
  await expect(page.getByTestId('muse-bubble-action')).toContainText(
    /new task added/i
  );

  // 7. TopBar lastAction badge
  await expect(page.getByTestId('topbar-status')).toContainText(/ACTION/);

  // 8. Close sheet, verify Board picked up the new task
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('muse-sheet')).toHaveCount(0);
  await expect(page.getByText('call the lawyer about the contract')).toBeVisible({ timeout: 5_000 });
});

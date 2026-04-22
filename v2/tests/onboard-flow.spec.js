// Phase 4 E2E — onboarding flow.
//
// Mocks /api/* so no network credentials are required. Stubs MediaRecorder +
// getUserMedia so mic taps produce deterministic blobs. Covers intro through
// LOCK IT IN, review-screen edits, empty extraction, transcription failure,
// and partial-commit-then-selective-retry (validates the committed-skip fix).

import { test, expect } from '@playwright/test';

const EMPTY_BOARD = { summary: [] };

const Q1_TRANSCRIPT = "I'm running Lionmaker Systems and a Pallister consulting gig.";
const Q2_TRANSCRIPT = 'V2 launch deadline Friday. Pallister invoice needs reconciliation.';
const Q3_TRANSCRIPT = 'Close the V2 launch.';

const EXTRACTED_TWO = [
  {
    name: 'Lionmaker Systems',
    category: 'In Business',
    priority: 1,
    note: '',
    tasks: [
      { text: 'Launch V2', priority: 1, category: 'In Business' },
      { text: 'Write design doc', priority: 2, category: 'In Business' }
    ]
  },
  {
    name: 'Pallister Consulting',
    category: 'On Business',
    priority: 2,
    note: '',
    tasks: [
      { text: 'Reconcile invoice', priority: 1, category: 'On Business' }
    ]
  }
];

const EXTRACTED_THREE_NO_TASKS = [
  { name: 'ProjA', category: 'In Business', priority: 2, note: '', tasks: [] },
  { name: 'ProjB', category: 'In Business', priority: 2, note: '', tasks: [] },
  { name: 'ProjC', category: 'In Business', priority: 2, note: '', tasks: [] }
];

async function installMediaRecorderStub(page) {
  await page.addInitScript(() => {
    // Suppress CSS animations so Playwright's actionability checks don't wait
    // on the mic-pulse / hero-pulse loops that would otherwise time out.
    const disableAnim = () => {
      const style = document.createElement('style');
      style.textContent = `*, *::before, *::after { animation: none !important; transition: none !important; }`;
      document.head.appendChild(style);
    };
    if (document.head) disableAnim();
    else document.addEventListener('DOMContentLoaded', disableAnim);

    const fakeStream = { getTracks: () => [{ stop: () => {} }] };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => fakeStream }
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
        // ≥200B payload so postTranscribe's empty-blob guard doesn't short-circuit.
        const bytes = new Uint8Array(512);
        bytes[0] = 0x1a; bytes[1] = 0x45; bytes[2] = 0xdf; bytes[3] = 0xa3;
        const blob = new Blob([bytes], { type: 'audio/webm' });
        queueMicrotask(() => {
          if (this.ondataavailable) this.ondataavailable({ data: blob });
          if (this.onstop) this.onstop();
        });
      }
    }
    window.MediaRecorder = FakeMediaRecorder;
  });
}

async function routeEmptyBoard(page) {
  await page.route('**/api/backlog', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_BOARD)
      });
      return;
    }
    await route.fallback();
  });
}

async function routeSequentialTranscribe(page, texts) {
  let i = 0;
  await page.route('**/api/transcribe', async (route) => {
    const text = texts[Math.min(i, texts.length - 1)];
    i++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text })
    });
  });
}

async function routeChiefExtraction(page, projects) {
  await page.route('**/api/chief', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: '',
        actions: [{ type: 'extract_onboarding', projects }]
      })
    });
  });
}

async function drivePastIntro(page) {
  await expect(page.getByTestId('onboard-root')).toBeVisible();
  await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'intro');
  await page.getByTestId('onboard-begin').click();
}

async function driveThroughQuestion(page, qNum) {
  await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', `q${qNum}-ask`);
  await page.getByTestId('onboard-mic-armed').click();
  await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', `q${qNum}-record`);
  await page.getByTestId('onboard-mic-recording').click();
}

test.describe('Onboarding flow — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installMediaRecorderStub(page);
  });

  // ── Test 1 — Happy path ────────────────────────────────────────────────
  test('1. Happy path — intro through LOCK IT IN done', async ({ page }) => {
    await routeEmptyBoard(page);
    await routeSequentialTranscribe(page, [Q1_TRANSCRIPT, Q2_TRANSCRIPT, Q3_TRANSCRIPT]);
    await routeChiefExtraction(page, EXTRACTED_TWO);

    let projectSeq = 0;
    const projectCalls = [];
    await page.route('**/api/project', async (route) => {
      projectSeq++;
      const body = route.request().postDataJSON();
      projectCalls.push(body.name);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, project: { id: `proj_${projectSeq}`, name: body.name } })
      });
    });

    const taskCalls = [];
    await page.route('**/api/backlog', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        taskCalls.push(req.postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, task_id: `t_${taskCalls.length}` })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_BOARD)
      });
    });

    await page.goto('/');

    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await driveThroughQuestion(page, 2);
    await driveThroughQuestion(page, 3);

    // parsing → review
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'review', { timeout: 10_000 });

    // Two project panels rendered with extracted data
    await expect(page.getByTestId('onboard-project-name-0')).toHaveValue('Lionmaker Systems');
    await expect(page.getByTestId('onboard-project-name-1')).toHaveValue('Pallister Consulting');

    // LOCK IT IN → commit → done → onboard closes
    await page.getByTestId('onboard-lock-in').click();
    await expect(page.getByTestId('onboard-root')).toHaveCount(0, { timeout: 10_000 });

    // Two projects + three tasks committed
    expect(projectCalls).toEqual(['Lionmaker Systems', 'Pallister Consulting']);
    expect(taskCalls).toHaveLength(3);
  });

  // ── Test 2 — Review-screen edits commit edited state ──────────────────
  test('2. Review edits — rename/delete/add committed, not original extraction', async ({ page }) => {
    await routeEmptyBoard(page);
    await routeSequentialTranscribe(page, [Q1_TRANSCRIPT, Q2_TRANSCRIPT, Q3_TRANSCRIPT]);
    await routeChiefExtraction(page, EXTRACTED_TWO);

    const projectCalls = [];
    await page.route('**/api/project', async (route) => {
      const body = route.request().postDataJSON();
      projectCalls.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, project: { id: `proj_${projectCalls.length}`, name: body.name } })
      });
    });

    const taskCalls = [];
    await page.route('**/api/backlog', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        taskCalls.push(req.postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, task_id: `t_${taskCalls.length}` })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_BOARD)
      });
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await driveThroughQuestion(page, 2);
    await driveThroughQuestion(page, 3);

    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'review', { timeout: 10_000 });

    // 1. Rename project 0
    const p0Name = page.getByTestId('onboard-project-name-0');
    await p0Name.fill('');
    await p0Name.fill('Renamed Project');

    // 2. Raise project 0's priority (P1 → clamps at 1; was 1 → still 1).
    //    Instead, lower it: click Lower priority (▼) in project head.
    await page.getByTestId('onboard-project-0').getByLabel('Lower priority').first().click();
    // Priority was 1 → now 2. Verify via store by proxy: the commit payload.

    // 3. Delete task[1] of project 0 ("Write design doc")
    await page.getByTestId('onboard-project-0').getByLabel('Delete task').nth(1).click();

    // 4. Add a new task to project 0
    await page.getByTestId('onboard-add-task-0').click();
    const newTaskInput = page.getByTestId('onboard-task-0-1');
    await newTaskInput.fill('Added task from review');

    // LOCK IT IN
    await page.getByTestId('onboard-lock-in').click();
    await expect(page.getByTestId('onboard-root')).toHaveCount(0, { timeout: 10_000 });

    // Assertions against captured payloads
    expect(projectCalls).toHaveLength(2);
    expect(projectCalls[0].name).toBe('Renamed Project');
    expect(projectCalls[0].priority).toBe(2); // raised from 1 via Lower button
    expect(projectCalls[1].name).toBe('Pallister Consulting');

    // Tasks: project 0 had 2 → deleted 1 → added 1 → commits 2 tasks
    // Project 1 had 1 task → commits 1 task. Total 3.
    expect(taskCalls).toHaveLength(3);
    const p0Tasks = taskCalls.filter(c => c.project_id === 'proj_1');
    const p1Tasks = taskCalls.filter(c => c.project_id === 'proj_2');
    expect(p0Tasks).toHaveLength(2);
    expect(p1Tasks).toHaveLength(1);
    const p0TaskTexts = p0Tasks.map(c => c.task.text).sort();
    expect(p0TaskTexts).toEqual(['Added task from review', 'Launch V2']);
    // Deleted "Write design doc" is not in any commit
    expect(taskCalls.some(c => c.task?.text === 'Write design doc')).toBe(false);
  });

  // ── Test 3 — Empty extraction ──────────────────────────────────────────
  test('3. Empty extraction — error screen with retry and restart', async ({ page }) => {
    await routeEmptyBoard(page);
    await routeSequentialTranscribe(page, [Q1_TRANSCRIPT, Q2_TRANSCRIPT, Q3_TRANSCRIPT]);
    await routeChiefExtraction(page, []); // empty projects list

    await page.goto('/');
    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await driveThroughQuestion(page, 2);
    await driveThroughQuestion(page, 3);

    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'error', { timeout: 10_000 });
    await expect(page.getByText('No projects detected', { exact: false })).toBeVisible();

    // RETRY on empty extraction routes back to intro (no extracted data → intro path).
    await page.getByTestId('onboard-error-retry').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'intro');

    // Navigate back to error state via a second full run to test START FRESH.
    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await driveThroughQuestion(page, 2);
    await driveThroughQuestion(page, 3);
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'error', { timeout: 10_000 });

    await page.getByTestId('onboard-error-restart').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'intro');
  });

  // ── Test 4 — Transcription failure on Q2 ───────────────────────────────
  test('4. Transcription failure on Q2 — error then retry returns to q2-ask', async ({ page }) => {
    await routeEmptyBoard(page);

    let transcribeCalls = 0;
    await page.route('**/api/transcribe', async (route) => {
      transcribeCalls++;
      if (transcribeCalls === 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'whisper unavailable' })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: transcribeCalls === 1 ? Q1_TRANSCRIPT : Q2_TRANSCRIPT })
      });
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'q2-ask');
    await page.getByTestId('onboard-mic-armed').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'q2-record');
    await page.getByTestId('onboard-mic-recording').click();

    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'error', { timeout: 10_000 });

    // Retry → back to q2-ask; Q1 answer still in history
    await page.getByTestId('onboard-error-retry').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'q2-ask');
    await expect(page.getByText(Q1_TRANSCRIPT)).toBeVisible();
  });

  // ── Test 5 — Partial commit failure + selective retry ──────────────────
  test('5. Partial commit — selective retry skips already-committed projects', async ({ page }) => {
    await routeEmptyBoard(page);
    await routeSequentialTranscribe(page, [Q1_TRANSCRIPT, Q2_TRANSCRIPT, Q3_TRANSCRIPT]);
    await routeChiefExtraction(page, EXTRACTED_THREE_NO_TASKS);

    const projectCalls = [];
    await page.route('**/api/project', async (route) => {
      const body = route.request().postDataJSON();
      projectCalls.push(body.name);
      const priorAttempts = projectCalls.filter(n => n === body.name).length;
      if (body.name === 'ProjC' && priorAttempts === 1) {
        // First attempt on ProjC fails.
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'registry write failed' })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, project: { id: `proj_${body.name}`, name: body.name } })
      });
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveThroughQuestion(page, 1);
    await driveThroughQuestion(page, 2);
    await driveThroughQuestion(page, 3);

    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'review', { timeout: 10_000 });

    // First LOCK IT IN — 2 succeed, 1 fails.
    await page.getByTestId('onboard-lock-in').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'error', { timeout: 10_000 });
    await expect(page.getByText('1 item failed', { exact: false })).toBeVisible();
    expect(projectCalls).toEqual(['ProjA', 'ProjB', 'ProjC']);

    // RETRY → back to review (committing origin recovers to review).
    await page.getByTestId('onboard-error-retry').click();
    await expect(page.getByTestId('onboard-root')).toHaveAttribute('data-step', 'review');

    // LOCK IT IN again — ProjA and ProjB must be skipped; only ProjC retried.
    await page.getByTestId('onboard-lock-in').click();
    await expect(page.getByTestId('onboard-root')).toHaveCount(0, { timeout: 10_000 });

    // Selective-retry invariant: A and B called once, C called twice, total 4.
    expect(projectCalls.filter(n => n === 'ProjA')).toHaveLength(1);
    expect(projectCalls.filter(n => n === 'ProjB')).toHaveLength(1);
    expect(projectCalls.filter(n => n === 'ProjC')).toHaveLength(2);
    expect(projectCalls).toHaveLength(4);
  });
});

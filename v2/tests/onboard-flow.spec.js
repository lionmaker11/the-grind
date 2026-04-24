// Phase 4 E2E — onboarding flow (R5b rewrite).
//
// This suite replaces the R3-era three-question flow tests. It exercises the
// current single-capture + optional-clarify state machine defined in
// phase4-flow-redesign.md, asserting through helpers in tests/helpers and
// fixtures in tests/fixtures.
//
// Spec reference: vault/build/phase4-redesign-spec.md § Playwright Test Plan.
// Six tests — happy path, review edits, empty extraction, transcribe
// failure, partial commit + selective retry, clarify path. Merge/orphan
// tests (6–10 in the spec) deferred to R5b-8b.

import { test, expect } from '@playwright/test';
import { installMediaRecorderStub } from './helpers/media-recorder.js';
import { setupMockBackend } from './helpers/mock-backend.js';
import {
  drivePastIntro,
  driveCapture,
  driveClarify,
  driveThroughParsingToReview,
  driveLockIn
} from './helpers/drive-flow.js';
import { EMPTY_REGISTRY } from './fixtures/empty-registry.js';
// POPULATED_REGISTRY intentionally unused in this batch — reserved for
// R5b-8b merge/orphan tests.

// ─── Shared scenario constants ─────────────────────────────────────────────

const HAPPY_TRANSCRIPT = 'Running Lionmaker Systems and Pallister Consulting.';

const HAPPY_EXTRACTION = {
  projects: [
    {
      name: 'Lionmaker Systems',
      category: 'In Business',
      tasks: [
        { text: 'Ship V2 onboarding' },
        { text: 'Write design doc' }
      ]
    },
    {
      name: 'Pallister Consulting',
      category: 'On Business',
      tasks: [
        { text: 'Reconcile April invoice' }
      ]
    }
  ],
  orphan_tasks: []
};

const EDITS_EXTRACTION = {
  projects: [
    {
      name: 'Alpha',
      tasks: [
        { text: 'alpha-task-original-1' },
        { text: 'alpha-task-to-delete' }
      ]
    },
    {
      name: 'Beta',
      tasks: [
        { text: 'beta-task-single' }
      ]
    }
  ],
  orphan_tasks: []
};

const THREE_EMPTY_PROJECTS = {
  projects: [
    { name: 'ProjA', tasks: [] },
    { name: 'ProjB', tasks: [] },
    { name: 'ProjC', tasks: [] }
  ],
  orphan_tasks: []
};

// ─── Local helpers ─────────────────────────────────────────────────────────

/**
 * Read the trailing tempId off a project card's data-testid attribute so
 * tests can address the card's named sub-testids without knowing the tempId
 * at test-write time. Card root selector is `.or-project`; its testid is
 * `onboard-project-${tempId}`.
 */
async function readProjectTempId(card) {
  const raw = await card.getAttribute('data-testid');
  return raw?.replace(/^onboard-project-/, '') || '';
}

/**
 * Same pattern for task rows. Row selector is `.task-row`; its testid is
 * `onboard-task-${tempId}`.
 */
async function readTaskTempId(row) {
  const raw = await row.getAttribute('data-testid');
  return raw?.replace(/^onboard-task-/, '') || '';
}

test.describe('Phase 4 onboarding — R5b', () => {
  test.beforeEach(async ({ page }) => {
    await installMediaRecorderStub(page);
  });

  // ─── Test 1 — Happy path (deep) ──────────────────────────────────────
  test('1 happy: capture → review → lock in commits every project and task', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: [HAPPY_TRANSCRIPT],
      extraction: HAPPY_EXTRACTION
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveCapture(page);
    await driveThroughParsingToReview(page);

    await expect(page.getByText('Lionmaker Systems')).toBeVisible();
    await expect(page.getByText('Pallister Consulting')).toBeVisible();

    await driveLockIn(page);

    // Pass 2 — two projects created, in extraction order.
    expect(capture.projects).toHaveLength(2);
    expect(capture.projects[0].name).toBe('Lionmaker Systems');
    expect(capture.projects[1].name).toBe('Pallister Consulting');

    // Pass 3 — three tasks total, all with order:'append' (R5b-6c invariant).
    expect(capture.backlog).toHaveLength(3);
    expect(capture.backlog.every((b) => b.task?.order === 'append')).toBe(true);

    // Task grouping — 2 tasks under Lionmaker, 1 under Pallister.
    const byProject = capture.backlog.reduce((acc, b) => {
      acc[b.project_id] = (acc[b.project_id] || 0) + 1;
      return acc;
    }, {});
    expect(byProject['lionmaker-systems']).toBe(2);
    expect(byProject['pallister-consulting']).toBe(1);
  });

  // ─── Test 2 — Review edits (deep) ────────────────────────────────────
  test('2 review edits: rename + delete + add + long-press urgent flow to commit', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: ['two projects'],
      extraction: EDITS_EXTRACTION
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveCapture(page);
    await driveThroughParsingToReview(page);

    const cards = page.locator('.or-project');
    const card0 = cards.first();
    const p0 = await readProjectTempId(card0);

    // Rename project 0: tap name → fill inline input → Enter.
    await page.getByTestId(`onboard-project-name-${p0}`).click();
    const nameInput = page.getByTestId(`onboard-project-name-input-${p0}`);
    await nameInput.fill('Alpha Renamed');
    await nameInput.press('Enter');
    await expect(page.getByText('Alpha Renamed')).toBeVisible();

    // Expand project so task rows become interactive.
    await page.getByTestId(`onboard-project-expand-${p0}`).click();

    // Delete the task whose text is 'alpha-task-to-delete'.
    const taskRows = card0.locator('.task-row');
    const rowCount = await taskRows.count();
    let deletedTempId = null;
    for (let i = 0; i < rowCount; i++) {
      const row = taskRows.nth(i);
      const rowTid = await readTaskTempId(row);
      const text = await page.getByTestId(`onboard-task-text-${rowTid}`).textContent();
      if ((text || '').includes('alpha-task-to-delete')) {
        await page.getByTestId(`onboard-task-delete-${rowTid}`).click();
        deletedTempId = rowTid;
        break;
      }
    }
    expect(deletedTempId).not.toBeNull();

    // Wait for Preact's re-render to commit the delete before proceeding.
    // Without this, the subsequent .task-row locators still see the deleted row.
    await expect(taskRows).toHaveCount(rowCount - 1);

    // Long-press the first remaining task to toggle urgent. longpress.js
    // fires on 500ms hold without movement, and the handlers bind to
    // .task-text (not .task-row) — Playwright mouse.down → 650ms → mouse.up
    // on the .task-text bounding box is the reliable stand-in.
    const firstRemaining = card0.locator('.task-row').first();
    const longPressTextEl = firstRemaining.locator('[data-testid^="onboard-task-text-"]');
    const longPressedText = ((await longPressTextEl.textContent()) || '').trim();
    const textBox = await longPressTextEl.boundingBox();
    if (textBox) {
      await page.mouse.move(textBox.x + textBox.width / 2, textBox.y + textBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(650);
      await page.mouse.up();
    }

    // Add a new task to project 0 — the review surface creates an empty
    // .task-row on add-task click; entering its text requires tapping the
    // ✎ edit affordance to reveal the inline input.
    const taskRowsForAdd = card0.locator('.task-row');
    const beforeAddCount = await taskRowsForAdd.count();

    await page.getByTestId(`onboard-add-task-${p0}`).click();

    // Wait for the new empty .task-row to materialize in the DOM.
    await expect(taskRowsForAdd).toHaveCount(beforeAddCount + 1);

    const newTaskRow = taskRowsForAdd.last();
    const newTid = await readTaskTempId(newTaskRow);
    await page.getByTestId(`onboard-task-edit-${newTid}`).click();
    const newTaskInput = page.getByTestId(`onboard-task-text-input-${newTid}`);
    await newTaskInput.fill('alpha-task-newly-added');
    await newTaskInput.press('Enter');

    // Drag-to-reorder is explicitly SKIPPED in this test. drag.js uses
    // pointermove thresholds Playwright's drag helpers don't trigger
    // reliably. Ordering is covered manually in phone test (Pattern 3)
    // and re-evaluated under R5b-7 if defects surface.

    await driveLockIn(page);

    // Renamed name flows through Pass 2.
    expect(capture.projects.find((p) => p.name === 'Alpha Renamed')).toBeDefined();
    expect(capture.projects.find((p) => p.name === 'Alpha')).toBeUndefined();

    // Project 0 net task count unchanged (-1 delete + 1 add).
    const p0Tasks = capture.backlog.filter((b) => b.project_id === 'alpha-renamed');
    const p1Tasks = capture.backlog.filter((b) => b.project_id === 'beta');
    expect(p0Tasks).toHaveLength(2);
    expect(p1Tasks).toHaveLength(1);

    // Deleted task never POSTed; added task did.
    const allText = capture.backlog.map((b) => b.task?.text);
    expect(allText).not.toContain('alpha-task-to-delete');
    expect(allText).toContain('alpha-task-newly-added');

    // Long-press marked at least one task urgent, including the one we pressed.
    const urgent = capture.backlog.filter((b) => b.task?.urgent === true);
    expect(urgent.length).toBeGreaterThanOrEqual(1);
    expect(urgent.some((b) => (b.task?.text || '').trim() === longPressedText)).toBe(true);
  });

  // ─── Test 3 — Empty extraction (shallow) ─────────────────────────────
  test('3 empty extraction: chief returns nothing → error, empty-extraction variant', async ({ page }) => {
    await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: ['rambling with no projects']
      // extraction left default → { projects: [], orphan_tasks: [] }
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveCapture(page);

    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'error', { timeout: 10_000 });
    await expect(page.getByTestId('onboard-error-empty-extraction')).toBeVisible();
  });

  // ─── Test 4 — Transcription failure (shallow) ────────────────────────
  test('4 transcribe failure on capture → error, transcription variant', async ({ page }) => {
    await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: [''],
      transcribeFailOn: [0]
    });

    await page.goto('/');
    await drivePastIntro(page);

    // Inline — driveCapture would assert step transitions we expect to bail.
    await page.getByTestId('onboard-mic-armed').click();
    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'capture-record');
    await page.getByTestId('onboard-mic-recording').click();

    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'error', { timeout: 10_000 });
    await expect(page.getByTestId('onboard-error-transcription')).toBeVisible();
  });

  // ─── Test 5 — Partial commit → selective retry (deep) ────────────────
  test('5 partial commit: ProjC fails once, A/B committed-skipped on retry', async ({ page }) => {
    // Requires mock-backend.js amendment: fail-first-only per name. See
    // addendum below this file proposal.
    const capture = await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: ['three projects'],
      extraction: THREE_EMPTY_PROJECTS,
      projectAddFailOnName: 'ProjC'
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveCapture(page);
    await driveThroughParsingToReview(page);

    // First LOCK IT IN — orchestrator commits A and B, then 500s on C.
    await page.getByTestId('onboard-lock-in').click();
    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'error', { timeout: 10_000 });
    await expect(page.getByTestId('onboard-error-partial-commit')).toBeVisible();

    // RETRY → clearError → ERROR_RECOVERY_STEP['committing'] === 'review'.
    // The partial-commit variant's testid is on the button itself
    // (OnboardError.jsx:74), so clicking this testid fires clearError.
    await page.getByTestId('onboard-error-partial-commit').click();
    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'review');

    // Second LOCK IT IN — only ProjC re-attempted (A, B flagged committed).
    // Fail-first-only amendment makes the second attempt succeed.
    await driveLockIn(page);

    const names = capture.projects.map((p) => p.name);
    expect(names.filter((n) => n === 'ProjA')).toHaveLength(1);
    expect(names.filter((n) => n === 'ProjB')).toHaveLength(1);
    expect(names.filter((n) => n === 'ProjC')).toHaveLength(2);
    expect(capture.projects).toHaveLength(4);
  });

  // ─── Test 6 — Clarify path (shallow) ─────────────────────────────────
  test('6 clarify path: first chief triggers clarify-ask, second chief resolves', async ({ page }) => {
    const capture = await setupMockBackend(page, {
      registry: EMPTY_REGISTRY,
      transcripts: ['vague capture', 'clarifying detail'],
      // First call: at least one project (empty-extraction guard runs before
      // clarify check; both-empty would route to error instead of clarify-ask).
      extraction: {
        projects: [{ name: 'Pending Project', tasks: [] }],
        orphan_tasks: [],
        clarification_needed: { question: 'Which project is highest priority?' }
      },
      // Second call: the real extraction after clarify.
      extractionClarifyThenResolve: {
        projects: [
          { name: 'Resolved Project', tasks: [{ text: 'Resolved task' }] }
        ],
        orphan_tasks: []
      }
    });

    await page.goto('/');
    await drivePastIntro(page);
    await driveCapture(page);
    await expect(page.getByTestId('onboard-root'))
      .toHaveAttribute('data-step', 'clarify-ask', { timeout: 10_000 });
    await driveClarify(page);
    await driveThroughParsingToReview(page);

    await expect(page.getByText('Resolved Project')).toBeVisible();
    await expect(page.getByText('Pending Project')).not.toBeVisible();

    expect(capture.chief).toHaveLength(2);
  });
});

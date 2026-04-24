// Step-granular helpers for driving the onboarding state machine in tests.
//
// Each helper is a small, predictable unit — tests compose them to advance
// past setup steps and focus their assertions on the step under test.
// Every helper observes the state machine via data-step on [data-testid=
// onboard-root] rather than guessing via visible text: step transitions
// are the source of truth.
//
// State machine (phase4-flow-redesign.md):
//   idle → intro → capture-ask → capture-record → (parsing →)
//   [clarify-ask → clarify-record → parsing →] review → committing → done
//
// Testid sharing between capture and clarify:
// - onboard-mic-armed is used by BOTH OnboardAsk (capture-ask) and
//   OnboardClarify (clarify-ask) on their armed mic buttons.
// - onboard-mic-recording is used by OnboardRecord which handles BOTH
//   capture-record and clarify-record (branches internally on step).
// So driveCapture and driveClarify click the same testids — the state
// machine's data-step is what disambiguates which phase we're in.
//
// Timeouts default to 10s — parsing + chief LLM round-trip is the slowest
// mocked step, and Playwright's global test timeout is 30s.

import { expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 10_000;

/**
 * Wait for the onboard-root element to report a given step.
 * Private — if a Gate 2 test needs direct access, export it then.
 * @param {import('@playwright/test').Page} page
 * @param {string} step
 * @param {number} [timeout]
 */
async function waitForStep(page, step, timeout = DEFAULT_TIMEOUT) {
  const root = page.getByTestId('onboard-root');
  await expect(root).toHaveAttribute('data-step', step, { timeout });
}

/**
 * From idle/intro: tap the begin button, land on capture-ask.
 * @param {import('@playwright/test').Page} page
 */
export async function drivePastIntro(page) {
  await waitForStep(page, 'intro');
  await page.getByTestId('onboard-begin').click();
  await waitForStep(page, 'capture-ask');
}

/**
 * From capture-ask: tap armed mic → recording → tap again → stop.
 * Leaves the state machine at whatever step follows capture-record (parsing,
 * then either clarify-ask or review depending on the mocked chief response).
 * Caller is responsible for asserting the next step.
 * @param {import('@playwright/test').Page} page
 */
export async function driveCapture(page) {
  await waitForStep(page, 'capture-ask');
  await page.getByTestId('onboard-mic-armed').click();
  await waitForStep(page, 'capture-record');
  // FakeMediaRecorder is inactive until .stop() runs — but the UI needs a
  // beat for isRecording to flip true and enable the stop button.
  const stopBtn = page.getByTestId('onboard-mic-recording');
  await expect(stopBtn).toBeEnabled();
  await stopBtn.click();
  // Do NOT assert next step here — callers pick between parsing/clarify/review.
}

/**
 * From clarify-ask: tap armed mic → clarify-record → tap again → stop.
 * Testids match capture (see top-of-file sharing note). Callers that want
 * SKIP should click onboard-skip-clarify directly instead.
 * @param {import('@playwright/test').Page} page
 */
export async function driveClarify(page) {
  await waitForStep(page, 'clarify-ask');
  await page.getByTestId('onboard-mic-armed').click();
  await waitForStep(page, 'clarify-record');
  const stopBtn = page.getByTestId('onboard-mic-recording');
  await expect(stopBtn).toBeEnabled();
  await stopBtn.click();
}

/**
 * Wait until the state machine lands on `review`. Use this after driveCapture
 * (when no clarify is configured) or after driveClarify to bridge across the
 * parsing step without the test caring about its transient presence.
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=10_000]
 */
export async function driveThroughParsingToReview(page, timeout = DEFAULT_TIMEOUT) {
  await waitForStep(page, 'review', timeout);
}

/**
 * From review: tap LOCK IT IN and wait for onboard-root to disappear.
 *
 * Why not waitForStep('done'): the 'done' step is TRANSIENT. App.jsx unmounts
 * the onboarding UI the instant the state machine reports 'done', so the
 * data-step attribute is never observable from outside — the element is gone.
 * Watching for toBeHidden is the reliable terminal signal for a successful
 * commit.
 *
 * Tests that need to observe mid-commit state (e.g. partial-commit → error)
 * should NOT call this helper — click onboard-lock-in directly and assert
 * on the expected intermediate step.
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=10_000]
 */
export async function driveLockIn(page, timeout = DEFAULT_TIMEOUT) {
  await waitForStep(page, 'review');
  await page.getByTestId('onboard-lock-in').click();
  await expect(page.getByTestId('onboard-root')).toBeHidden({ timeout });
}

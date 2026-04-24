// MediaRecorder + getUserMedia stub for Playwright.
//
// Extracted VERBATIM from the original onboard-flow.spec.js (R3 era).
// Three concerns, bundled because every onboarding test needs all three:
//   1. Suppress CSS animations so Playwright's actionability checks don't
//      time out on the mic-pulse / hero-pulse loops.
//   2. Stub navigator.mediaDevices.getUserMedia so it resolves instantly
//      with a fake stream (no permission prompt, no real mic).
//   3. Replace window.MediaRecorder with FakeMediaRecorder — emits a
//      512-byte audio/webm blob on stop (≥200B to clear postTranscribe's
//      empty-blob guard in v2/src/lib/api.js).
//
// Must be called BEFORE page.goto() so the init script lands on the first
// document. Idempotent per page context.

/**
 * Install the full stub suite on a Playwright page.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function installMediaRecorderStub(page) {
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

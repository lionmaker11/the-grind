import { beginCapture } from '../../state/onboard.js';

// Screen 41 — centered hero + capture copy + cyan glyph ▶ CTA.
// No close affordance (user can only exit once capture begins). V2 flow
// is one capture + optional clarify, not three fixed questions.

export function OnboardIntro() {
  return (
    <div class="onboard-intro">
      <div class="intro-top">
        <img src="/assets/lionmaker-logo.png" class="onboard-hero-logo" alt="Lionmaker" />
        <div class="onboard-wordmark">THEGRIND</div>
        <div class="onboard-tagline">// A LIONMAKER SYSTEM</div>
      </div>
      <div class="intro-mid">
        <div class="onboard-welcome">
          Dump what&apos;s on your plate.
          <br />
          Out loud. Take your time.
        </div>
        <button
          type="button"
          class="btn-primary glyph-only"
          aria-label="Begin onboarding"
          onClick={beginCapture}
          data-testid="onboard-begin"
        >
          ▶
        </button>
      </div>
      <div class="intro-bottom" />
    </div>
  );
}

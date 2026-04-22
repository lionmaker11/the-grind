import { beginQuestions } from '../../state/onboard.js';

// Screen 16 — centered hero + three-questions copy + cyan glyph ▶ CTA.
// No close affordance (user can only exit once questions begin).

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
          Three questions.
          <br />
          Answer out loud.
        </div>
        <button
          type="button"
          class="btn-primary glyph-only"
          aria-label="Begin onboarding"
          onClick={beginQuestions}
          data-testid="onboard-begin"
        >
          ▶
        </button>
      </div>
      <div class="intro-bottom" />
    </div>
  );
}

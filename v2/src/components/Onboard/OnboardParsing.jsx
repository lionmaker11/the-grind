// Parsing screen — fires off the onboard-mode chief request and routes
// the extracted payload (projects + orphan tasks + optional clarification)
// into the review / clarify surface via receiveExtraction. Only component
// that imports postChief.
//
// Runs on both first pass (after capture-record) and second pass (after
// clarify-record). Second-pass request bundles the clarify transcript so
// Opus can refine its extraction; receiveExtraction suppresses a second
// clarification round even if the model emits one.
//
// Mockup reference: 39-onboard-parsing.html — renders the capture Q/A
// (and clarify Q/A if it happened) as conversation bubbles, with the
// extraction spinner beneath.

import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { onboardStore, receiveExtraction, setError } from '../../state/onboard.js';
import { postChief } from '../../lib/api.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';
import './OnboardParsing.css';

const CAPTURE_QUESTION = "What's active right now?";

function buildTranscriptMessage(capture, clarify) {
  const parts = [`[CAPTURE]\n${(capture || '').trim()}`];
  if (clarify) {
    parts.push(`[CLARIFY]\n${clarify.trim()}`);
  }
  return parts.join('\n\n');
}

export function OnboardParsing() {
  const { step, capture, clarify, extracted } = useStore(onboardStore);
  const firedRef = useRef(false);
  const unmountedRef = useRef(false);

  // Second-pass parsing: if we already have `extracted` AND `clarify`,
  // the user went through the clarify round and landed back here.
  // Render both Q/A pairs. On first pass, only the capture pair.
  const clarifyQuestion = extracted?.clarificationNeeded?.question || '';
  const showClarifyPair = Boolean(clarify) && Boolean(clarifyQuestion);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    (async () => {
      try {
        const message = buildTranscriptMessage(capture, clarify);
        const res = await postChief({ mode: 'onboard', message });
        if (unmountedRef.current) return;
        const extract = (res.actions || []).find((a) => a.type === 'extract_onboarding');
        const payload = extract && typeof extract === 'object' ? extract : {};
        receiveExtraction({
          projects: Array.isArray(payload.projects) ? payload.projects : [],
          orphan_tasks: Array.isArray(payload.orphan_tasks) ? payload.orphan_tasks : [],
          clarification_needed: payload.clarification_needed || null
        });
      } catch (err) {
        if (unmountedRef.current) return;
        // First-pass parsing failure → 'empty-extraction' (recovery is
        // re-record from intro since there's no extracted data to fall back
        // on). Second-pass failure → 'generic' (recovery is review with the
        // first-pass extracted data preserved).
        const isFirstPass = onboardStore.get().clarify === null;
        const variant = isFirstPass ? 'empty-extraction' : 'generic';
        setError('parsing', err?.message || 'extraction failed', variant, true);
      }
    })();
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo" data-testid="onboard-convo">
        <OnboardMessage role="muse" text={CAPTURE_QUESTION} />
        {capture && <OnboardMessage role="user" variant="finalized" text={capture} />}
        {showClarifyPair && (
          <>
            <OnboardMessage role="muse" text={clarifyQuestion} />
            <OnboardMessage role="user" variant="finalized" text={clarify} />
          </>
        )}
        <div class="parsing-block">
          <div class="parsing-spinner" aria-hidden="true" />
          <div class="parsing-label">
            <span>Thinking…</span>
            <span class="parsing-dots" aria-hidden="true">
              <span /><span /><span />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

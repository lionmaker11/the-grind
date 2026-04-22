// Parsing screen — fires off the onboard-mode chief request and routes
// the extracted projects into the review surface. Only component that
// imports postChief.

import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { onboardStore, receiveExtraction, setError } from '../../state/onboard.js';
import { postChief } from '../../lib/api.js';
import { OnboardFooter } from './OnboardFooter.jsx';
import { OnboardMessage } from './OnboardMessage.jsx';
import './OnboardMessage.css';
import './OnboardParsing.css';

const QUESTIONS = {
  1: 'What projects are you running right now?',
  2: "What's on fire? Anything overdue or due this week.",
  3: 'Close one thing this week. What is it?'
};

function buildTranscriptMessage(answers) {
  return [
    `[Q1 — ${QUESTIONS[1]}]\n${(answers.q1 || '').trim()}`,
    `[Q2 — ${QUESTIONS[2]}]\n${(answers.q2 || '').trim()}`,
    `[Q3 — ${QUESTIONS[3]}]\n${(answers.q3 || '').trim()}`
  ].join('\n\n');
}

export function OnboardParsing() {
  const { step, answers } = useStore(onboardStore);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    (async () => {
      try {
        const message = buildTranscriptMessage(answers);
        const res = await postChief({ mode: 'onboard', message });
        const extract = (res.actions || []).find((a) => a.type === 'extract_onboarding');
        const projects = extract && Array.isArray(extract.projects) ? extract.projects : [];
        receiveExtraction(projects);
      } catch (err) {
        setError('parsing', err?.message || 'extraction failed', true);
      }
    })();
  }, []);

  return (
    <>
      <OnboardFooter step={step} />
      <div class="onboard-convo" data-testid="onboard-convo">
        <OnboardMessage role="muse" text={QUESTIONS[3]} />
        <OnboardMessage role="user" variant="finalized" text={answers.q3 || '—'} />
        <div class="parsing-block">
          <div class="parsing-spinner" aria-hidden="true" />
          <div class="parsing-label">
            <span>// PARSING INPUT</span>
            <span class="parsing-dots" aria-hidden="true">
              <span /><span /><span />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

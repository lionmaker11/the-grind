// R5a FUNCTIONAL PLACEHOLDER — replaced in R5b by full review UI. Exists
// to validate end-to-end commit flow before R5b's UI surface lands.
// Renders a minimal read-only list of extracted projects + orphan count,
// auto-deletes orphans on commit (bypassing assignment UI), and watches
// for step === 'done' to tear down the onboard takeover.
//
// No polish, no match-merge decisions surfaced, no urgent toggles, no
// drag. R5b owns all of that.

import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  onboardStore,
  deleteOrphan,
  startCommit,
  commitOnboardingResults,
  clearError,
  closeOnboard
} from '../../state/onboard.js';
import { OnboardFooter } from './OnboardFooter.jsx';

export function OnboardReview() {
  const { step, extracted, commitProgress, error } = useStore(onboardStore);
  const projects = extracted?.projects || [];
  const orphans = extracted?.orphanTasks || [];
  const { total, completed, failed } = commitProgress;
  const hasFailures = failed && failed.length > 0;
  const inProgress = step === 'committing';
  const isDone = step === 'done';
  const isError = step === 'error';

  // Tear down the takeover ~1s after finishCommit flips step to 'done'
  // so the user sees the "DONE" status briefly before the Board appears.
  useEffect(() => {
    if (!isDone) return;
    const id = setTimeout(() => closeOnboard(true), 1000);
    return () => clearTimeout(id);
  }, [isDone]);

  function handleLock() {
    if (inProgress) return;
    // Placeholder shortcut: auto-delete every orphan so the commit
    // orchestrator doesn't need per-orphan assignments. R5b's UI lets
    // the user assign them to projects (new or existing) instead.
    for (const o of orphans) {
      if (!o.committed) deleteOrphan(o.tempId);
    }
    startCommit();
    commitOnboardingResults();
  }

  return (
    <>
      <OnboardFooter step={step} />
      <div class="or-placeholder" data-testid="onboard-review-placeholder">
        <div class="or-placeholder-banner">
          // R5a PLACEHOLDER — full review UI lands in R5b.
        </div>

        <ul class="or-placeholder-list">
          {projects.map((p) => (
            <li key={p.tempId} data-testid={`onboard-project-${p.tempId}`}>
              <strong>{p.name || '(unnamed)'}</strong>
              {' — '}
              {p.tasks.length} task{p.tasks.length === 1 ? '' : 's'}
              {p.matched_existing_id && (
                <span class="or-placeholder-match">
                  {' · matches '}<code>{p.matched_existing_id}</code>
                  {' (confidence '}{p.match_confidence.toFixed(2)}{')'}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div class="or-placeholder-orphans" data-testid="onboard-orphan-count">
          Orphan tasks: {orphans.length} (will be auto-deleted on commit)
        </div>

        {inProgress && (
          <div class="or-placeholder-progress" data-testid="onboard-commit-progress">
            LOCKING IN · {completed} / {total}
            {failed.length > 0 && (
              <span> · {failed.length} failed</span>
            )}
          </div>
        )}

        {hasFailures && (
          <div class="or-placeholder-failures" data-testid="onboard-commit-failures">
            <div>// FAILURES ({failed.length})</div>
            {failed.map((f, i) => (
              <div key={i} class="or-placeholder-failure-line">
                [{f.kind}] {f.project ? `${f.project} · ` : ''}{f.name ? `${f.name} · ` : ''}{f.text ? `"${f.text}" · ` : ''}{f.reason}
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div class="or-placeholder-error" role="alert">
            // ERROR: {error?.message || 'commit failed'}
            <button
              type="button"
              onClick={clearError}
              data-testid="onboard-placeholder-retry"
            >
              RETRY
            </button>
          </div>
        )}

        {isDone && (
          <div class="or-placeholder-done" data-testid="onboard-commit-done">
            // DONE · closing…
          </div>
        )}

        <button
          type="button"
          class="or-placeholder-lock"
          onClick={handleLock}
          disabled={inProgress || isDone || projects.length === 0}
          data-testid="onboard-lock-in"
        >
          LOCK IT IN (TEST) ▶
        </button>
      </div>
    </>
  );
}

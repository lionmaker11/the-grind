// Backlog detail modal — Phase 5b-4.
//
// Modal frame + header + body container. The task rows themselves land
// in 5b-5; this commit ships the chrome so the modal can mount, display
// the project context, and close cleanly.
//
// Mount path: App.jsx render switch watches backlogStore.openProjectId.
// When non-null, BacklogDetail mounts as a position:fixed overlay above
// Board (z-index: 50 — same as Focus). Per Decision 9, modal cannot open
// while Focus is active; the render switch enforces this by checking
// focusStore.activeTaskId first.
//
// Layout per mockup 23-backlog-detail.html, simplified per phase5b-spec.md
// "What is NOT in Phase 5b": pomo aggregate panel + 4-dot rail removed
// (relocated to Phase 6 / Focus). Header keeps eyebrow + project name +
// urgent line + close button. Body shows loading / error / empty states
// and a placeholder for the task list that 5b-5 will replace.
//
// Council 4 (5b-3) flagged: profile modal-with-Board-fetching on iPhone
// before merge — if backdrop-filter repaint cost causes scroll jank,
// switch fetchBoard to debounced. Backdrop-filter is NOT used here
// (modal background is solid var(--bg) per mockup, not blurred), so
// the concern reduces to general Board re-render cost behind the modal.

import { useStore } from '@nanostores/preact';
import { backlogStore, close } from '../../state/backlog.js';
import { BacklogList } from './BacklogList.jsx';
import './BacklogDetail.css';

export function BacklogDetail() {
  const { tasks, projectName, taskCount, urgentCount, loading, error } =
    useStore(backlogStore);

  return (
    <main
      class="backlog-modal"
      data-testid="backlog-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backlog-modal-project-name"
    >
      <header class="backlog-modal-header">
        <button
          type="button"
          class="backlog-modal-close"
          onClick={() => close()}
          data-testid="backlog-modal-close"
          aria-label="Close backlog"
        >
          ▼
        </button>
        <div class="backlog-modal-eyebrow">➤ // BACKLOG</div>
        <div id="backlog-modal-project-name" class="backlog-modal-project">
          {projectName || '...'}
        </div>
        <div class="backlog-modal-urgent-line">
          <span class="n">{urgentCount} URGENT</span>
          <span class="dim"> / {taskCount} TASKS</span>
        </div>
      </header>

      <div class="backlog-modal-body">
        {loading && (
          <div class="backlog-modal-loading" data-testid="backlog-modal-loading">
            // LOADING
          </div>
        )}

        {!loading && error && (
          <div class="backlog-modal-error" data-testid="backlog-modal-error">
            <div class="backlog-modal-error-label">// ERROR</div>
            <div class="backlog-modal-error-message">{error}</div>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div class="backlog-modal-empty" data-testid="backlog-modal-empty">
            // NO PENDING TASKS
          </div>
        )}

        {!loading && !error && tasks.length > 0 && <BacklogList />}
      </div>
    </main>
  );
}

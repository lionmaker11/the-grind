// Focus surface state — minimal store for Phase 5a stub.
//
// Phase 5a ships only a placeholder Focus surface (back button + stub
// copy). focusStore drives the App.jsx render switch: when
// activeTaskId is set, Focus replaces Board.
//
// activeProjectId carried alongside taskId/text beyond the strict
// phase5a-spec.md Decision 5 shape. Phase 6's real Focus surface
// needs project context for the project chip per mockup 06; passing
// it through now (caller already has it via launchTask in board.js)
// avoids a back-trace lookup later.

import { map } from 'nanostores';

export const focusStore = map({
  activeTaskId: null,
  activeTaskText: '',
  activeProjectId: null
});

export function setActive(taskId, taskText, projectId) {
  focusStore.set({
    activeTaskId: taskId,
    activeTaskText: taskText || '',
    activeProjectId: projectId || null
  });
}

export function clear() {
  focusStore.set({
    activeTaskId: null,
    activeTaskText: '',
    activeProjectId: null
  });
}

// Empty vault registry — used by tests that onboard from a clean slate
// (test 1 happy path, test 2 review edits, test 3 empty extraction,
// test 4 transcription failure, test 5 partial commit).
//
// Shape matches api/backlog.js GET (no project_id) response exactly:
// { summary: [...] } — boardStore reads summary on mount, OrphanPicker
// reads it for the "IN EXISTING PROJECT" section.

export const EMPTY_REGISTRY = {
  summary: []
};

// Populated vault registry — used by tests that exercise merge detection
// (test 6 MERGE confirm, test 7 override to CREATE NEW, test 8 low-confidence
// match) and orphan-assign-to-existing (test 10). Also used by Phase 5a
// Board flow tests (5a-9) to exercise the urgent-first sort behavior added
// in 5a-3.
//
// Shape matches api/backlog.js GET (no project_id): each entry is
// { project_id, project_name, priority, task_count, last_touched, top }
// where `top` is an array of { id, text, priority, urgent } (at most the
// top-3 surfaced on the Board, pre-sorted urgent-first per api/_lib/vault.js
// sortByPriority — see 5a-3 commit for the sort change). Onboarding only
// reads project_id and project_name for merge/orphan decisions, but we
// populate `top` realistically so any component reading the registry
// behaves normally.
//
// last_touched is YYYY-MM-DD to match api/backlog.js today() format.
//
// Three projects, deliberately chosen:
//   - 'Lionmaker Systems'   — exact-name-match target for test 6 MERGE.
//                             Carries one urgent + two non-urgent tasks
//                             so 5a-9 can assert urgent-first sort
//                             behavior (urgent task at top despite
//                             higher priority number than the non-urgent
//                             tasks below it).
//   - '708 Pallister'       — fuzzy/low-confidence target for test 8
//                             ("Palmer Consulting" vs "708 Pallister")
//   - 'Motor City Deals'    — third registry entry to ensure the existing-
//                             projects list in OrphanPicker renders > 1
//                             row (test 10 assigns to one specifically)

export const POPULATED_REGISTRY = {
  summary: [
    {
      project_id: 'lionmaker-systems',
      project_name: 'Lionmaker Systems',
      priority: 1,
      task_count: 3,
      urgent_count: 1,
      last_touched: '2026-04-20',
      top: [
        // Pre-sorted urgent-first to match what api/backlog.js GET returns
        // after sortByPriority. Even though 't-lm-urgent' has priority:3,
        // it floats above the priority:1 and priority:2 tasks because
        // urgent:true takes precedence (5a-3 sort change).
        { id: 't-lm-urgent', text: 'Address production blocker', priority: 3, urgent: true },
        { id: 't-lm-1', text: 'Ship V2 onboarding', priority: 1, urgent: false },
        { id: 't-lm-2', text: 'Write design doc', priority: 2, urgent: false }
      ]
    },
    {
      project_id: '708-pallister',
      project_name: '708 Pallister',
      priority: 2,
      task_count: 1,
      urgent_count: 0,
      last_touched: '2026-04-18',
      top: [
        { id: 't-pall-1', text: 'Reconcile April invoice', priority: 1, urgent: false }
      ]
    },
    {
      project_id: 'motor-city-deals',
      project_name: 'Motor City Deals',
      priority: 3,
      task_count: 0,
      urgent_count: 0,
      last_touched: '2026-04-15',
      top: []
    }
  ]
};

// Board-flow test 7 (Empty Board): every project's top[] is empty,
// so Board.jsx's allEmpty short-circuit fires and renders EmptyState.
// Cannot use EMPTY_REGISTRY (summary: []) for this — that triggers
// useAutoOnboard in App.jsx, routing the user into Onboard instead
// of letting Board render its empty branch.
export const BOARD_EMPTY_TOP_REGISTRY = {
  summary: [
    {
      project_id: 'empty-project',
      project_name: 'Empty Project',
      priority: 1,
      task_count: 0,
      urgent_count: 0,
      last_touched: '2026-05-01',
      top: []
    }
  ]
};

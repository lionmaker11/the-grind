// Populated vault registry — used by tests that exercise merge detection
// (test 6 MERGE confirm, test 7 override to CREATE NEW, test 8 low-confidence
// match) and orphan-assign-to-existing (test 10).
//
// Shape matches api/backlog.js GET (no project_id): each entry is
// { project_id, project_name, priority, task_count, last_touched, top }
// where `top` is an array of { id, text, priority } (at most the top-3
// urgent tasks surfaced on the Board; onboarding only reads project_id
// and project_name for merge/orphan decisions, but we populate `top`
// realistically so any component reading the registry behaves normally).
//
// last_touched is YYYY-MM-DD to match api/backlog.js today() format.
//
// Three projects, deliberately chosen:
//   - 'Lionmaker Systems'   — exact-name-match target for test 6 MERGE
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
      task_count: 2,
      last_touched: '2026-04-20',
      top: [
        { id: 't-lm-1', text: 'Ship V2 onboarding', priority: 1 },
        { id: 't-lm-2', text: 'Write design doc', priority: 2 }
      ]
    },
    {
      project_id: '708-pallister',
      project_name: '708 Pallister',
      priority: 2,
      task_count: 1,
      last_touched: '2026-04-18',
      top: [
        { id: 't-pall-1', text: 'Reconcile April invoice', priority: 1 }
      ]
    },
    {
      project_id: 'motor-city-deals',
      project_name: 'Motor City Deals',
      priority: 3,
      task_count: 0,
      last_touched: '2026-04-15',
      top: []
    }
  ]
};

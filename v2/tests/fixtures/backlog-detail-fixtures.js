// Backlog detail full-backlog fixtures — used by 5b-8 tests.
//
// Distinct from populated-registry.js: that fixture provides the
// summary shape for GET /api/backlog (no project_id) — top-3 only,
// pre-sorted urgent-first per backend's sortByPriority.
//
// This fixture provides the FULL per-project backlog shape for
// GET /api/backlog?project_id=X (5b-3 backlogStore.openProject):
// `{ schema_version, project_id, project_name, tasks: [...] }`
// where `tasks` is the full list (not just top-3) and includes
// pending + done tasks (frontend filters via preparePending).
//
// The two fixtures share project IDs so a single test setup can
// supply both: registry summary for Board render, backlogs map
// for modal open.

// Lionmaker Systems — full backlog with mix of urgent + normal,
// includes one done task to verify preparePending filter.
const LIONMAKER_FULL = {
  schema_version: 1,
  project_id: 'lionmaker-systems',
  project_name: 'Lionmaker Systems',
  tasks: [
    {
      id: 't-lm-urgent',
      text: 'Address production blocker',
      priority: 3,
      urgent: true,
      status: 'pending',
      created: '2026-04-21'
    },
    {
      id: 't-lm-1',
      text: 'Ship V2 onboarding',
      priority: 1,
      urgent: false,
      status: 'pending',
      created: '2026-04-21'
    },
    {
      id: 't-lm-2',
      text: 'Write design doc',
      priority: 2,
      urgent: false,
      status: 'pending',
      created: '2026-04-21'
    },
    {
      id: 't-lm-3',
      text: 'Refactor state layer',
      priority: 4,
      urgent: false,
      status: 'pending',
      created: '2026-04-22'
    },
    {
      id: 't-lm-done',
      text: 'Old completed task that should NOT appear in modal',
      priority: 1,
      urgent: false,
      status: 'done',
      completed: '2026-05-10',
      created: '2026-04-15'
    }
  ]
};

// 708 Pallister — single non-urgent task. Used for empty-section-
// label tests (NORMAL has 1 task, URGENT has 0).
const PALLISTER_FULL = {
  schema_version: 1,
  project_id: '708-pallister',
  project_name: '708 Pallister',
  tasks: [
    {
      id: 't-pall-1',
      text: 'Reconcile April invoice',
      priority: 1,
      urgent: false,
      status: 'pending',
      created: '2026-04-23'
    }
  ]
};

// Motor City Deals — empty backlog. Used for the empty-state test
// (modal opens, no tasks render, "// NO PENDING TASKS" placeholder).
const MOTOR_CITY_FULL = {
  schema_version: 1,
  project_id: 'motor-city-deals',
  project_name: 'Motor City Deals',
  tasks: []
};

// Fitness — single recurring daily task. Used to verify the
// recurring-task fix from 5b-5 Codex Phase 3 (completing a recurring
// task does NOT remove it from the modal optimistically — backend
// keeps it pending and just stamps last_completed).
const FITNESS_FULL = {
  schema_version: 1,
  project_id: 'fitness',
  project_name: 'Fitness',
  tasks: [
    {
      id: 'fit-001',
      text: '30 minute minimum workout',
      priority: 1,
      urgent: false,
      status: 'pending',
      recurring: 'daily',
      created: '2026-04-21',
      last_completed: '2026-05-14'
    }
  ]
};

export const BACKLOG_FIXTURES = {
  'lionmaker-systems': LIONMAKER_FULL,
  '708-pallister': PALLISTER_FULL,
  'motor-city-deals': MOTOR_CITY_FULL,
  'fitness': FITNESS_FULL
};

// Registry summary that matches the BACKLOG_FIXTURES projects (so
// Board renders chevrons that, when tapped, fetch from the matching
// full-backlog fixture above). Mirrors POPULATED_REGISTRY shape.
// Includes 'fitness' so the recurring-task test has a registry
// entry to render a Board card from.
export const BACKLOG_REGISTRY = {
  summary: [
    {
      project_id: 'lionmaker-systems',
      project_name: 'Lionmaker Systems',
      priority: 1,
      task_count: 4, // matches LIONMAKER_FULL pending count (excluding done)
      urgent_count: 1,
      last_touched: '2026-05-14',
      top: [
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
      last_touched: '2026-05-13',
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
      last_touched: '2026-05-10',
      top: []
    },
    {
      project_id: 'fitness',
      project_name: 'Fitness',
      priority: 4,
      task_count: 1,
      urgent_count: 0,
      last_touched: '2026-05-14',
      top: [
        { id: 'fit-001', text: '30 minute minimum workout', priority: 1, urgent: false }
      ]
    }
  ]
};

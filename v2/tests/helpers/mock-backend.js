// Shared Playwright mock backend for onboarding AND Board tests.
//
// Mounts page.route handlers for every /api/* endpoint these surfaces
// touch. Returns a `capture` object whose arrays accumulate request
// payloads in call order so tests can assert "chief was called twice
// with X then Y" or "backlog got 3 POSTs for project A and 1 for B".
//
// Response shapes mirror the real handlers EXACTLY — see:
//   - api/backlog.js (GET summary OR GET ?project_id=X full backlog;
//                     POST op:add / op:complete / op:reorder /
//                     op:toggle_urgent / op:update_task_text /
//                     op:delete_task — POST handler branches on body.op
//                     since 5a-8 added Board mutators; 5b-2 added edit
//                     + delete ops; 5b-8 added project_id GET path for
//                     backlogStore.openProject)
//   - api/project.js (POST op:add)
//   - api/chief.js   (POST returns { actions: [...] }; onboarding action has
//                     type:'extract_onboarding' with { projects, orphan_tasks,
//                     clarification_needed? } — see OnboardParsing.jsx and
//                     state/onboard.js receiveExtraction)
//   - api/transcribe.js (POST audio → { text })
//
// Keep this helper thin: it MUST NOT know about specific test scenarios.
// Config comes in via the options bag; behaviors (fail-on-name, clarify-
// then-resolve) are explicit toggles, not hardcoded per test.

const DEFAULT_EXTRACTION = { projects: [], orphan_tasks: [] };

/**
 * @typedef {Object} ExtractOnboardingPayload
 * @property {Array<Object>} projects
 *   Per-project objects with keys: name, category?, urgent?, note?,
 *   matched_existing_id?, match_confidence?, tasks:[{text, urgent?, category?}].
 *   Snake_case on the wire — see state/onboard.js receiveExtraction.
 * @property {Array<Object>} orphan_tasks
 *   Per-orphan objects with keys: text, urgent?, category?,
 *   suggested_new_project_name?.
 * @property {Object} [clarification_needed]
 *   If present: { question: string }. Triggers the clarify-ask step.
 */

/**
 * @typedef {Object} MockBackendOptions
 * @property {Object} [registry]   — GET /api/backlog response (no project_id). Defaults to { summary: [] }.
 * @property {Object<string, Object>} [backlogs]
 *   Map of project_id → full-backlog response payload, used by GET
 *   /api/backlog?project_id=X (Phase 5b-3 backlogStore.openProject).
 *   Each value should be the inner backlog object: { schema_version,
 *   project_id, project_name, tasks: [...] }. Mock wraps it as
 *   { backlog: <value> } per real handler. Missing project_id → 404.
 * @property {string[]} [transcripts]
 *   Array of transcript strings returned by sequential POST /api/transcribe
 *   calls. Index 0 = capture, index 1 = clarify. If the array is exhausted
 *   the last entry is reused.
 * @property {number[]} [transcribeFailOn]
 *   Call indices (0-based) at which POST /api/transcribe returns 500.
 *   e.g. [0] fails the first (capture) transcribe.
 * @property {ExtractOnboardingPayload} [extraction]
 *   First chief response body (wrapped by this helper in the
 *   { actions:[{ type:'extract_onboarding', ... }] } envelope). Defaults
 *   to DEFAULT_EXTRACTION (empty, which makes receiveExtraction route to
 *   the 'empty-extraction' error variant).
 * @property {ExtractOnboardingPayload} [extractionClarifyThenResolve]
 *   If set, the FIRST chief call returns `extraction` (which should include
 *   clarification_needed). The SECOND and later calls return this object.
 *   Used by tests exercising the clarify-ask → clarify-record path.
 * @property {string} [projectAddFailOnName]
 *   If POST /api/project comes in with this exact name (case-sensitive),
 *   return 500 on the FIRST call for that name only; subsequent calls
 *   succeed. Used by the partial-commit test.
 * @property {string} [backlogAddFailOnText]
 *   If POST /api/backlog comes in with this task text (case-sensitive),
 *   return 500. Used for partial-commit scenarios involving task-level
 *   failures (optional; may be unused by Gate 2).
 * @property {string} [backlogEditFailOnText]
 *   If POST /api/backlog op:update_task_text comes in with this exact
 *   text (case-sensitive, post-trim), return 500. Used by 5b-8 to
 *   exercise the save-failed row state introduced in 5b-6.
 */

/**
 * @typedef {Object} MockBackendCapture
 * @property {Array<Object>} chief      — Parsed request bodies, oldest first.
 * @property {Array<Object>} transcribe — { callIndex } per call, oldest first.
 * @property {Array<Object>} projects   — Parsed POST bodies in call order.
 * @property {Array<Object>} backlog    — Parsed POST bodies in call order.
 */

/**
 * Install /api/* route handlers on `page` and return a capture object.
 * Routes auto-clean with Playwright's per-test page context — no teardown needed.
 * @param {import('@playwright/test').Page} page
 * @param {MockBackendOptions} [options]
 * @returns {Promise<MockBackendCapture>}
 */
export async function setupMockBackend(page, options = {}) {
  const registry = options.registry || { summary: [] };
  const backlogs = options.backlogs || {};
  const transcripts = options.transcripts || [''];
  const transcribeFailOn = new Set(options.transcribeFailOn || []);
  const extraction = options.extraction || DEFAULT_EXTRACTION;
  const clarifyResolve = options.extractionClarifyThenResolve || null;
  const projectFail = options.projectAddFailOnName || null;
  const backlogFail = options.backlogAddFailOnText || null;
  const editFail = options.backlogEditFailOnText || null;
  const projectFailedOnce = new Set();

  const capture = { chief: [], transcribe: [], projects: [], backlog: [] };

  // GET /api/backlog → registry summary (no project_id) OR full
  //   per-project backlog (with project_id, used by 5b-3 backlogStore).
  // POST /api/backlog → branches on body.op (5a-4 mutators + 5b-2 ops).
  await page.route('**/api/backlog**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      const url = new URL(req.url());
      const projectId = url.searchParams.get('project_id');
      if (projectId) {
        // Single-project full backlog response per 5b-3 contract.
        const backlog = backlogs[projectId];
        if (!backlog) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: `Unknown project: ${projectId}` })
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ backlog })
        });
        return;
      }
      // Summary response (existing).
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registry)
      });
      return;
    }
    if (req.method() === 'POST') {
      const body = safeJson(req.postData());
      capture.backlog.push(body);
      const op = body?.op;

      // Board mutators (5a-4 → 5a-7). Real handler shapes match
      // api/backlog.js POST branches; tests filter capture.backlog
      // by op to assert per-mutator behavior.
      if (op === 'complete') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            task: { id: body.task_id, status: 'done', completed: '2026-05-12' }
          })
        });
        return;
      }
      if (op === 'reorder') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        });
        return;
      }
      if (op === 'toggle_urgent') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            task: { id: body.task_id, urgent: body.urgent }
          })
        });
        return;
      }
      // 5b-2 ops. Mock applies the same trim().slice(0, 200) normalization
      // the real handler does so test assertions on echoed text match what
      // production would return — Codex flagged this during 5b-2 review.
      if (op === 'update_task_text') {
        const cleanText = typeof body.text === 'string'
          ? body.text.trim().slice(0, 200)
          : body.text;
        // Test-only failure trigger: if backlogEditFailOnText was supplied
        // and matches, return 500 to exercise the save-failed row state
        // introduced in 5b-6.
        if (editFail && cleanText === editFail) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: '{"error":"mock edit fail"}'
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            task: { id: body.task_id, text: cleanText }
          })
        });
        return;
      }
      if (op === 'delete_task') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        });
        return;
      }

      // op:add — existing path (onboarding commit orchestrator). Real
      // client wraps task fields under body.task — see api/backlog.js
      // op:add and the orchestrator in v2/src/state/onboard.js. The
      // failure hook and synthesized response must read the same shape.
      const t = body?.task || {};
      if (backlogFail && t.text === backlogFail) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"mock task fail"}' });
        return;
      }
      const task = {
        id: `task-${capture.backlog.length}`,
        text: t.text || '',
        done_condition: '',
        category: t.category || '',
        estimated_pomodoros: 0,
        status: 'pending',
        created: '2026-04-23T00:00:00Z',
        ...(t.urgent !== undefined ? { urgent: t.urgent } : {}),
        ...(t.order !== undefined ? { order: t.order } : {})
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, task })
      });
      return;
    }
    await route.fallback();
  });

  // POST /api/project → add project (returns { ok: true, project: {...} }).
  await page.route('**/api/project**', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') { await route.fallback(); return; }
    const body = safeJson(req.postData());
    capture.projects.push(body);
    if (
      projectFail &&
      body?.name === projectFail &&
      !projectFailedOnce.has(projectFail)
    ) {
      projectFailedOnce.add(projectFail);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":"mock project fail"}'
      });
      return;
    }
    const id = slugify(body?.name || `project-${capture.projects.length}`);
    const project = {
      id,
      name: body?.name || '',
      status: 'active',
      priority: body?.priority ?? 3,
      folder: `vault/projects/${id}`,
      aliases: [],
      ...(body?.note ? { note: body.note } : {})
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, project })
    });
  });

  // POST /api/transcribe → text. Sequential, with optional failure indices.
  await page.route('**/api/transcribe**', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') { await route.fallback(); return; }
    const callIndex = capture.transcribe.length;
    capture.transcribe.push({ callIndex });
    if (transcribeFailOn.has(callIndex)) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"mock transcribe fail"}' });
      return;
    }
    const text = transcripts[Math.min(callIndex, transcripts.length - 1)] || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text })
    });
  });

  // POST /api/chief → { actions: [{ type:'extract_onboarding', ... }] }.
  // The frontend (OnboardParsing.jsx) looks for an action of that type and
  // passes its body to receiveExtraction. Clarify-then-resolve mode swaps
  // the extraction body on the 2nd+ call.
  await page.route('**/api/chief**', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') { await route.fallback(); return; }
    const body = safeJson(req.postData());
    capture.chief.push(body);
    const isFirst = capture.chief.length === 1;
    const extractBody = clarifyResolve && !isFirst ? clarifyResolve : extraction;
    const envelope = {
      actions: [
        { type: 'extract_onboarding', ...extractBody }
      ]
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(envelope)
    });
  });

  return capture;
}

function safeJson(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// Mirrors api/project.js makeId exactly: lowercase, [^a-z0-9]+→-, strip
// leading/trailing -, cap at 40 chars. The || 'project' fallback is a
// test-only guard against empty names.
function slugify(name) {
  return (String(name).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)) || 'project';
}

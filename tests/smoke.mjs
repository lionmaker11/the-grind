// smoke.mjs — pure Node ESM, no external deps
// Run: node tests/smoke.mjs  (from repo root)

// Inject env before any handler imports so module-level reads don't crash.
process.env.CHIEF_AUTH_TOKEN = 'test';
process.env.GITHUB_TOKEN = 'dummy';
process.env.ANTHROPIC_API_KEY = 'dummy';
process.env.GROQ_API_KEY = 'dummy';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function makeRes() {
  const state = { statusCode: 200, body: null, headers: {} };
  return {
    setHeader(k, v) { state.headers[k] = v; },
    status(code) { state.statusCode = code; return this; },
    json(obj) { state.body = obj; return this; },
    end() { return this; },
    _state: state,
  };
}

async function tryImport(path) {
  try {
    const mod = await import(path);
    return { handler: mod.default, error: null };
  } catch (err) {
    return { handler: null, error: err.message };
  }
}

async function runProbes(name, handler, { getIs405 = true, requiresToken = true }) {
  console.log(`\n[ ${name} ]`);

  // 1. OPTIONS → 200
  {
    const req = { method: 'OPTIONS', headers: {} };
    const res = makeRes();
    await handler(req, res);
    assert('OPTIONS → 200', res._state.statusCode === 200,
      `got ${res._state.statusCode}`);
  }

  // 2. GET → 405 (for POST-only endpoints) or GET → 401 (for backlog which accepts GET)
  if (getIs405) {
    const req = { method: 'GET', headers: {} };
    const res = makeRes();
    await handler(req, res);
    assert('GET → 405', res._state.statusCode === 405,
      `got ${res._state.statusCode}`);
  } else {
    // backlog accepts GET but still needs a token
    const req = { method: 'GET', headers: {} };
    const res = makeRes();
    await handler(req, res);
    assert('GET (no token) → 401', res._state.statusCode === 401,
      `got ${res._state.statusCode}`);
  }

  // 3. POST with no token → 401
  if (requiresToken) {
    const req = { method: 'POST', headers: {} };
    const res = makeRes();
    await handler(req, res);
    assert('POST (no token) → 401', res._state.statusCode === 401,
      `got ${res._state.statusCode}`);
  }

  // 4. POST with valid token but malformed/empty body → 400
  {
    const req = { method: 'POST', headers: { 'x-chief-token': 'test' }, body: {} };
    const res = makeRes();
    await handler(req, res);
    assert('POST (bad body) → 400', res._state.statusCode === 400,
      `got ${res._state.statusCode}`);
  }
}

// ── main ───────────────────────────────────────────────────────────────────────

const handlers = [
  { name: 'chief',     path: '../api/chief.js',      getIs405: true,  requiresToken: true },
  { name: 'backlog',   path: '../api/backlog.js',     getIs405: false, requiresToken: true },
  { name: 'project',   path: '../api/project.js',     getIs405: true,  requiresToken: true },
  { name: 'sync',      path: '../api/sync.js',        getIs405: true,  requiresToken: true },
  { name: 'transcribe',path: '../api/transcribe.js',  getIs405: true,  requiresToken: true },
];

for (const spec of handlers) {
  const { handler, error } = await tryImport(spec.path);
  if (error) {
    console.log(`\n[ ${spec.name} ]`);
    console.log(`  SKIP  Import failed: ${error}`);
    continue;
  }
  await runProbes(spec.name, handler, spec);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

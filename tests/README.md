# Smoke Tests

`tests/smoke.mjs` exercises the five Vercel API handlers (`chief`, `backlog`, `project`, `sync`, `transcribe`) without any network access or real environment variables. It probes four HTTP scenarios per handler: `OPTIONS` requests (expect 200 with CORS headers), `GET` against POST-only endpoints (expect 405), `POST` without an auth token (expect 401), and `POST` with a valid token but an empty/malformed body (expect 400). Because all four of these code paths return before any external call is made, the test requires no real Anthropic, GitHub, or Groq credentials — dummy values are injected at the top of the script. If a handler module fails to import (e.g. mid-rewrite or missing dependency), that handler is reported as `SKIP` with the import error and the rest of the suite continues.

To run the suite, execute the following from the repository root (Node 18+ required):

```
node tests/smoke.mjs
```

The script prints a `PASS`/`FAIL`/`SKIP` line per probe and exits with code `0` if everything passes or `1` on any failure. Note: this suite does **not** test business logic — priority math, GitHub round-trips, Anthropic streaming, or Groq transcription all require integration tests run with real environment variables and live network access.

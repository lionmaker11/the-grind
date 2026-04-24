# CLAUDE.md — Repo AI Agent Instructions

Repository: `lionmaker11/the-grind`. Currently in V2 rebuild. Production `/` is intentionally down during build — V1 has been deleted and V2 is under construction at `/v2/`.

## Build state

See `/vault/build/PHASES.md` for current phase, decision log, approved `/api/*`
exceptions, and patterns observed during the build. Read that file first
in any new Claude Code session before touching code.

## Authoritative sources (read in this order)

1. `/DESIGN.md` — V2 architectural spec. The contract.
2. `/design/mockups/` — V2 visual reference
3. `/vault/systems/muse-system.md` — Muse's character, voice, and tool manifest

## Active infrastructure — do not modify without explicit instruction

- `/api/**` — backend serverless functions (Anthropic, Groq, GitHub vault writes)
- `/vault/**` — source-of-truth data layer
- `/vercel.json` — routing config, touched only at V2 production flip

## V2 build lives in /v2/

Stack is locked per DESIGN.md: Preact + Vite + nanostores + vanilla CSS. No React, no TypeScript, no Tailwind, no component libraries, no additional state libraries. If tempted to reach for any, stop and ask.

## Review routine

This project uses the audit-flow plugin for lifecycle review. Run `/audit` after any shipped phase. Full rationale: the plugin's `references/playbook.md`.

## Owner

T.J. Typinski. Solo operator, one-user product, single-tenant.

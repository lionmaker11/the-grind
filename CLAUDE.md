# CLAUDE.md — Repo AI Agent Instructions

Repository: `lionmaker11/the-grind`. Currently in V2 rebuild. Production `/` is intentionally down during build — V1 has been deleted and V2 is under construction at `/v2/`.

## Design context

This repo's design recipe is `/DESIGN.md` (the V2 architectural contract) plus
`/v2/src/tokens.css` (the canonical token source — every CSS variable, color,
spacing step, motion curve). When doing any design / UI / motion work, the
`~/.claude/skills/design-system/SKILL.md` skill auto-loads and references
those two files as the per-project recipe; the global skills library
(`~/.claude/skills/design-system/*.md` — entry-animation, hero-scroll-pin,
intersection-observer-stagger, motion-respect-reduced) is the cross-project
ingredient set.

**`DESIGN.md` and `tokens.css` always win over any default the skills suggest.**
Skills propose generic patterns; this repo's contract is intentionally more
opinionated (cyberpunk mission-control register, hard-coded ambient layer,
460px container, no Tailwind, no TypeScript). When skill defaults conflict
with `DESIGN.md`, follow `DESIGN.md` and note the divergence in the work.

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

## Owner

T.J. Typinski. Solo operator, one-user product, single-tenant.

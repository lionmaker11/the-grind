# CLAUDE.md — Repo AI Agent Instructions

Repository: `lionmaker11/the-grind`. Currently in V2 rebuild. Production `/` is intentionally down during build — V1 has been deleted and V2 is under construction at `/v2/`.

See `/vault/build/PHASES.md` for current phase, decision log, approved `/api/*` exceptions, and patterns observed during the build. Read that file first in any new Claude Code session before touching code.

## Authoritative sources (read in this order)

1. `/DESIGN.md` — V2 architectural spec. The contract.
2. `/design/mockups/` — V2 visual reference
3. `/vault/systems/muse-system.md` — Muse's character, voice, and tool manifest

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

## Owner

T.J. Typinski. Solo operator, one-user product, single-tenant.

---

# Application Runtime Rules

> How the deployed Grind V2 product (Muse, API routes, vault writes) behaves at runtime. Documents product behavior. Model IDs and provider config live in code.

## Stack lock

Stack is locked per DESIGN.md: Preact + Vite + nanostores + vanilla CSS. No React, no TypeScript, no Tailwind, no component libraries, no additional state libraries. If tempted to reach for any, stop and ask.

## Active infrastructure — do not modify without explicit instruction

- `/api/**` — backend serverless functions (Anthropic, Groq, GitHub vault writes)
- `/vault/**` — source-of-truth data layer
- `/vercel.json` — routing config, touched only at V2 production flip

## V2 build location

V2 build lives in `/v2/`.

---

# Development Workflow Rules

> How Claude Code builds and reviews this codebase. Inherits global protocol from `~/.claude/CLAUDE.md`.

## Multi-model workflow — Project Overrides

This project inherits the global multi-model protocol defined in `~/.claude/CLAUDE.md` (codex MCP delegation rules, standard workflow for non-trivial features, when not to use codex, reporting). The block below adds project-specific overrides — additive, not replacing.

### Strict-mode carve-outs (override Standard)

Three areas escalate from Standard to Strict. Codex review is mandatory before commit; review summary goes in the commit message.

1. **`/api/*` edits** — Vercel serverless functions. Council-approved exceptions only (see `/vault/build/PHASES.md`). Codex review mandatory before commit. Diff shown to T.J. before apply per existing "show me the diff" review discipline. Budget 1–2 per phase.

2. **`/vault/**` writes** — split by operation type:
   - **Reads:** unrestricted. Free anytime, no codex needed.
   - **Writes:** codex review mandatory AND explicit confirmation from T.J. in chat *before the write executes*, not just before commit. The vault is GitHub-backed source-of-truth for T.J.'s real life-organizing data; bad writes corrupt real state, not test data.

3. **Stack-lock files** — `package.json`, `vite.config.*`, anything touching the locked stack (Preact / Vite / nanostores / vanilla CSS). Codex review before commit. `DESIGN.md` calls the stack non-negotiable; this enforces it. If tempted to add a dependency, stop-and-ask first, then route through codex review.

Everything else (`/v2/src/**` Preact components and CSS, tests, docs, vault reads) inherits the global protocol unmodified.

## Project-specific context

- **Single-user, single-tenant.** Don't propose multi-user features, auth flows beyond existing, or "what if other users…" design. T.J.'s personal tool, not a product.

- **Voice-first principle.** UX defaults to voice / minimal-tap. Flag any feature proposal that adds friction to voice capture.

- **Branch discipline.** Phase work stays on its phase branch until T.J. explicitly greenlights merge. Do not initiate merges, rebases, or force-pushes. No force-pushes ever, on any branch. Current phase and merge status live in `/vault/build/PHASES.md` — read there for live state, not here.

- **PWA constraints — quasi-strict.** Service worker, offline-first, install flow. Easy to break, hard to debug. Codex review recommended for any SW or manifest change even though not formally on the strict list above.

- **Solo-operator velocity.** Built between MCD, Pallister, MARCUS, and family. Don't over-engineer. If a feature ships in 50 lines, ship 50 lines, not 200.

- **Audit-flow integration.** `/audit` plugin runs post-phase (see Review routine below). Codex review during development complements — does not replace — audit-flow review at phase boundaries.

- **Mockups.** `/design/mockups/` is the visual source of truth (referenced in Authoritative sources above; reiterated here because mockup fidelity matters per phase).

- **Council specs.** `/vault/build/` holds council-approved specs for the active phase. Reference before proposing architectural changes. Don't redesign what councils have settled. Current phase's spec filenames are listed in `/vault/build/PHASES.md`.

## Review routine

This project uses the audit-flow plugin for lifecycle review. Run `/audit` after any shipped phase. Full rationale: the plugin's `references/playbook.md`.

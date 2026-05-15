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

The historical `/api/*` and `/vault/**` carve-outs were superseded on 2026-05-15 by the Dev Loop Protocol below. Dev Loop's auto-codex-on-everything (Phase 2) and auto-ship CLEAN gate (Phase 5) cover those surfaces with stronger cadence than the per-touch human-in-loop they had before. One area remains in Strict mode:

1. **Stack-lock files** — `package.json`, `vite.config.*`, anything touching the locked stack (Preact / Vite / nanostores / vanilla CSS). Codex review before commit. `DESIGN.md` calls the stack non-negotiable; this enforces it. If tempted to add a dependency, stop-and-ask first, then route through codex review. (Architectural, not workflow — Dev Loop doesn't override this.)

Everything else (`/api/*`, `/vault/**`, `/v2/src/**`, tests, docs) is governed by the Dev Loop Protocol below.

## Project-specific context

- **Single-user, single-tenant.** Don't propose multi-user features, auth flows beyond existing, or "what if other users…" design. T.J.'s personal tool, not a product.

- **Voice-first principle.** UX defaults to voice / minimal-tap. Flag any feature proposal that adds friction to voice capture.

- **Branch discipline.** Phase work happens on phase branches (e.g. `v2-phase5b`). Auto-merges to main are now in scope per Dev Loop Protocol's auto-ship gate. **No force-pushes ever, on any branch** — force-pushes destroy history regardless of protocol; Dev Loop does not override this. Current phase and merge status live in `/vault/build/PHASES.md` — read there for live state, not here.

- **PWA constraints — quasi-strict.** Service worker, offline-first, install flow. Easy to break, hard to debug. Codex review recommended for any SW or manifest change even though not formally on the strict list above.

- **Solo-operator velocity.** Built between MCD, Pallister, MARCUS, and family. Don't over-engineer. If a feature ships in 50 lines, ship 50 lines, not 200.

- **Audit-flow integration.** `/audit` plugin runs post-phase (see Review routine below). Codex review during development complements — does not replace — audit-flow review at phase boundaries.

- **Mockups.** `/design/mockups/` is the visual source of truth (referenced in Authoritative sources above; reiterated here because mockup fidelity matters per phase).

- **Council specs.** `/vault/build/` holds council-approved specs for the active phase. Reference before proposing architectural changes. Don't redesign what councils have settled. Current phase's spec filenames are listed in `/vault/build/PHASES.md`.

## Review routine

This project uses the audit-flow plugin for lifecycle review. Run `/audit` after any shipped phase. Full rationale: the plugin's `references/playbook.md`. Sits alongside Dev Loop Protocol's Phase 5 gate (per-phase audit vs per-task synthesis).

---

# Dev Loop Protocol

Activated 2026-05-15. Replaces `/api/*` and `/vault/**` strict-mode carve-outs above. All subsequent tasks run through this loop unless explicitly told otherwise.

## Session Start Protocol

At the start of every fresh session, before doing ANY work, run this orientation checklist silently (do not narrate it to the user unless something needs attention):

1. Read handoff notes: Check for `.claude/handoff.md` in the project root. If it exists, read it — this is what the previous session accomplished, what's in progress, and what's next.
2. Check git state: Run `git status` and `git log --oneline -10`. Look for uncommitted changes, stashed work, or in-progress branches from a previous session. If there are uncommitted changes, ask the user whether to continue that work or start fresh.
3. Read reviewer-context.md: Load the project's strategic context, quality standards, council composition guidance, and accumulated review learnings.
4. Check backlog: If `BACKLOG.md` exists, scan it for pending items. Do not start working on them unless the user asks — just be aware of them.
5. Check test health: Run the Tier 1 test suite. If tests are currently failing, note this to the user before starting new work.
6. Orient: You now know what happened last session, the current state of the codebase, the project's strategic context, and any pending work. Proceed with the user's task.

## How the Loop Works

When given a development task, execute it through five phases. Do NOT ask for permission between phases. Run the full loop autonomously. Only pause when the rules below explicitly say to.

**Phase 1 — Execute:** Build/implement the task. After implementation, automatically run all Tier 1 tests (unit tests, linting, type checking, build verification). If tests fail, fix and re-run. Do not flag the user for test failures you can resolve.

**Phase 2 — Standard Review:** Run a Codex standard code review on the changes via `mcp__codex__codex` MCP tool (preferred), `/codex:review` slash command, or `codex exec` via bash — whichever is available. If issues are found, fix them and re-run Phase 1 tests. Do not flag the user.

**Phase 3 — Adversarial Review:** Run a Codex adversarial review focused on the specific risk areas relevant to the changes made. Evaluate each finding:
- If you agree with the finding: fix it, re-run Phase 1 tests.
- If you disagree with the finding: note your reasoning. This goes into Phase 5.
- Do not flag the user.

**Phase 4 — Council Debate:** Read `reviewer-context.md`. Assemble a review council and run a structured debate.

Council Assembly (re-assemble fresh at EVERY Phase 4 — the council composition should evolve as the work evolves across loop cycles):

Seat 3 permanent members:
1. **The Architect** — Sees the whole system. Evaluates whether this change fits the project's architecture, patterns, and trajectory. Chairs the debate and delivers the synthesis.
2. **The Minimalist** — Challenges every line. "Do we need this? Can this be simpler? Is this adding complexity that will cost us later?" Kills over-engineering. (Aligns with project's "Solo-operator velocity" principle.)
3. **The Domain Expert** — Inferred from the "Project Domain" field in reviewer-context.md. For TheGrind: solo-operator personal voice-first PWA — seat a daily-driver-tool product specialist who understands the workflow risks of breaking the user's own daily tool.

Then seat exactly 3 dynamic specialists based on FOUR inputs (in priority order):
1. **What the code changes touch:** auth → security engineer; UI → UX specialist; DB queries → performance engineer; concurrency → concurrency specialist; new integrations → reliability engineer; vault writes → data integrity specialist; iOS Safari interactions → mobile-web specialist.
2. **What Codex flagged:** race conditions → concurrency specialist; data loss → data integrity expert. Codex findings tell you which expertise is needed.
3. **The project's risk profile:** Check `reviewer-context.md` "Risk Profile". Vault writes always seat a data-integrity specialist. iOS Safari changes always seat a mobile-web specialist.
4. **Past effectiveness:** Check `reviewer-context.md` "Past Council Members That Added Value". Prefer specialists that caught real issues before in similar areas.

Name each dynamic specialist, state their background in one sentence, and define what lens they bring. No generic roles ("Backend Engineer" too vague). At least one of the 3 dynamic members must be explicitly **adversarial** — their job is to assume the work is wrong and prove it.

The Debate (3 rounds):
- **Round 1 — Independent Reviews:** Each council member reviews from their perspective. Specific, concrete positions only. "This adds an O(n) scan inside a per-request loop that degrades above ~1000 items" — not "this could be slow."
- **Round 2 — Cross-Challenge:** Council members challenge each other's findings. The adversarial member actively tries to break the implementation.
- **Round 3 — Synthesis:** The Architect resolves the debate. Which concerns are valid? The Minimalist gets the last word: "Can we cut anything else?"

If the council identifies issues: fix them, re-run Phase 1 tests, loop back through Phases 2-3 on the new changes. If consensus that work is solid: proceed to Phase 5. Genuine unresolved disagreements signal the Phase 5 MESSY verdict.

**Phase 5 — Gate Decision:** Synthesize all findings (Phase 2 Codex standard, Phase 3 Codex adversarial, Phase 4 council). Score the run:

CLEAN (auto-ship):
- Resolved in ≤2 iteration cycles
- No unresolved disagreements with reviewers
- Council reached consensus
- Scope did not expand beyond the original task
- No Tier 3 testing required
→ Commit + push the work. Send a summary message: `✅ [task] — shipped. [1-2 sentence summary]. [N] review issues found and resolved. Moving to next task.`

MESSY (flag human):
- 3+ iteration cycles
- Unresolved disagreements between you and Codex reviewers
- Unresolved council debate
- Scope expanded beyond original task
- Architectural direction changed
→ Pause. Send detailed message explaining: what was built, what reviewers flagged, where you disagree, what decisions need human input. Wait for response.

NEEDS_TESTING (flag human):
- Changes require Tier 3 testing
→ Commit to a branch. Send a message explaining exactly what needs manual testing, on what device/platform, and what to look for. Wait for test results before merging.

## Iteration Rules

- Maximum iterations per phase: 5. If you're on iteration 5 and still finding issues, flag the user with full context. Something structural is wrong.
- Maximum total loop cycles: 3 (Phase 1-5 counts as one cycle). If you've gone through the full 5-phase loop 3 times and are still not clean, flag.
- Scope creep detection: If during any phase you realize the fix requires changing something outside the scope of the current task, do NOT make that change. Note it in `BACKLOG.md` as a follow-up and keep current scope focused.

## Escalation Rules — ALWAYS Flag

- Architectural or design decisions that change the project's direction
- 3+ failed iteration loops on the same issue
- External dependency changes (adding new packages, upgrading major versions, changing APIs)
- Any situation where you need information you don't have (credentials, business logic decisions, user preferences)
- Tier 3 testing scenarios

## Escalation Rules — NEVER Flag (Just Handle It)

- Bug fixes and code quality improvements
- Test failures you can diagnose and fix
- Reviewer suggestions you agree with
- File structure changes and refactoring
- Adding/updating Tier 1 or Tier 2 tests
- Documentation updates
- /api/* edits within the existing op-routing pattern
- Vault writes via existing /api/* mutators (autonomous; backed by codex + council)

## Testing Protocol

**Tier 1 — Always Run (every iteration, silent):**
- Unit tests
- Linting and type checking
- Build/compile verification
- Run automatically after every code change. Fix and retry on failure. Never flag for Tier 1.

**Tier 2 — Run When Scope Warrants (automatic, flag on repeated failure):**
- Playwright E2E tests for UI changes (forms, navigation, auth flows, visual rendering)
- API endpoint testing for backend changes
- Accessibility checks for UI changes
- Trigger: Assess whether changes touch UI components, user-facing flows, or API surfaces. If yes, write and run appropriate E2E/API tests.
- Escalation: If Tier 2 tests fail 3+ times on the same issue, flag.

**Tier 3 — Always Flag (requires human):**
- iPhone-specific behavior (gestures, responsive rendering on physical devices, PWA install/SW behavior)
- Third-party integration verification in production
- Visual/UX judgment calls that screenshots can't capture (animations, scroll feel, haptic feedback)
- Performance on real devices (load times, jank, battery impact)
- Any testing requiring credentials or accounts not available to Claude Code
- Action: Commit to branch. Message user with: what to test, on what device/platform, exact reproduction steps, what "pass" looks like. Include Playwright screenshots if available.

## Communication Format

**Auto-ship notification:**
```
✅ [task] — shipped
[1-2 sentence summary]
Reviews: [X] issues found, all resolved in [N] iterations
Council: [1 sentence on what the council debated, consensus reached]
Tests: Tier 1 ✓ | Tier 2 [✓/skipped/N/A]
Next: [what you're moving to, or "awaiting next task"]
```

**Escalation message:**
```
🔶 [task] — needs your input
What I built: [summary]
The issue: [specific blocker or decision needed]
Council debate: [key disagreement or unresolved concern]
Options I see: [if applicable]
What I need from you: [specific ask]
```

**Testing request:**
```
🧪 [task] — needs manual testing
Branch: [branch name]
Test on: [device/platform]
Steps:
1. [step]
2. [step]
What to look for: [specific pass/fail criteria]
```

## Task Queue

If the user provides multiple tasks, work through them sequentially. Each task gets the full 5-phase loop independently. Between tasks:
- Previous task CLEAN: auto-ship, send notification, immediately start next.
- Previous task MESSY or NEEDS_TESTING: pause, flag, do NOT start next until current is resolved.
- After all tasks complete (or are paused), send summary:
```
📋 Task queue complete
Shipped: [list]
Awaiting review: [list with reasons]
Backlog items captured: [count]
```

## Backlog Capture

During any phase, if you identify work that SHOULD be done but is OUTSIDE the scope of the current task, do NOT do it. Append to `BACKLOG.md` in the project root:
```
## [date] — captured during [task description]
- [ ] [backlog item description] — [why it matters, 1 sentence]
```
Session Start Protocol reads this so you're always aware of accumulated debt. The user can ask you to tackle backlog items at any time.

## Auto-Learning

At the end of every Phase 5 gate decision, if any Codex review or council debate surfaced a REAL issue that was fixed (not a false positive), append a one-line summary to the "Things Previous Reviews Have Caught" section of `reviewer-context.md`:
```
- [date]: [pattern description] — caught by [which reviewer/council member]
```
Cap at 20 entries. When it hits 20, consolidate the oldest entries into higher-level patterns.

Do NOT add false positives or minor style issues. Only patterns representing real bugs or architectural concerns missed during implementation.

## Session End Protocol

Before the session ends (whether naturally or because the user is done), write a handoff note to `.claude/handoff.md`:
```markdown
# Session Handoff — [date and time]

## Completed
- [task]: [1-sentence outcome, branch/commit if applicable]

## In Progress
- [task]: [current state, what's left, any blockers]

## Next Up
- [suggested next task or backlog item]

## Unresolved
- [any open questions, flagged issues, or decisions pending user input]

## Session Stats
- Tasks completed: [N]
- Total iteration cycles: [N]
- Issues caught by Codex: [N]
- Issues caught by council: [N]
- Auto-shipped: [N] | Flagged: [N]
```

`.claude/handoff.md` is in `.gitignore` — operational state, not source code.

## Session Usage Awareness

Track total iteration cycles (Phase 1-5 = one cycle) in the current session. After every 10 cycles, include a brief note in the next status message: "Note: this session has run [N] iteration cycles. Usage is elevated." Informational only — do not stop working.

# Phase 4 R5b Session Handoff

## Session resumption protocol

This doc is the first thing a fresh advisor session reads when resuming Phase 4 R5b work. It captures where R5b stands, what's decided, what's open, and how advisor/operator/Claude Code collaborate. Paste it at the top of a new chat alongside "we're resuming Phase 4 R5b, read this and tell me where we are." The governing specs (Council 1, Council 2, build log, open items) are linked in **Governing documents** below — read this doc first, then those, then respond.

## Where we are as of 23 April 2026

- HEAD on v2-phase4: **892ff9b**, 41 commits ahead of main
- Last landed commit: "v2 phase 4 R5b-6a: simple store-action wiring (expand, match toggle, delete, add)"
- Working tree clean, origin/v2-phase4 in sync with local HEAD.
- Bundle: JS 52.35 kB / gz 17.59 kB. CSS 37.01 kB / gz 7.21 kB. Both under budget.

R5b steps completed:
- **R5b-1** — extraction prompt conservative-binding (api/chief.js onboard-mode).
- **R5b-2** — api/backlog.js op=add accepts `order: 'append'` sentinel for merge-append.
- **R5b-3** — copy refresh across non-review onboarding components (Welcome/Listening/Parsing/Clarify/Done copy manifest pass).
- **R5b-3b** — OnboardError variant routing (error.variant drives component dispatch).
- **R5b-4** — OrphanPicker bottom-sheet component (registry-aware picker; mount wiring deferred to R5b-6b).
- **R5b-5** — OnboardReview structure + render, non-interactive (commit cf18a75). All markup rendered, all onClicks stubbed.
- **R5b-6a** — OnboardReview simple store-action wiring (commit 892ff9b). Expand chevron, match toggle, task delete, task add, project add, project delete (existing action, pre-orphan-conversion upgrade).

Next step: **R5b-6b₁** — drag wiring only. Project list + task lists within expanded projects.

## R5b sequence — full plan

| Step | Status | Description |
|------|--------|-------------|
| R5b-1 | COMPLETE | extraction prompt conservative-binding |
| R5b-2 | COMPLETE | api/backlog.js order:'append' sentinel |
| R5b-3 | COMPLETE | copy refresh non-review components |
| R5b-3b | COMPLETE | OnboardError variant routing |
| R5b-4 | COMPLETE | OrphanPicker bottom-sheet component |
| R5b-5 | COMPLETE (cf18a75) | OnboardReview structure + render, non-interactive |
| R5b-6a | COMPLETE (892ff9b) | OnboardReview simple store-action wiring |
| R5b-6b₁ | NEXT | Drag wiring — projects list + task lists |
| R5b-6b₂ | PENDING | contentEditable (project name, task text) + long-press urgent + OrphanPicker mount/unmount + orphan UNDO + deleteProject orphan-conversion upgrade (open #17) |
| R5b-6c | PENDING | Commit orchestrator — order:'append' frontend wiring + mid-commit abort guards (open #3) |
| R5b-7 | PENDING (conditional) | Drag utility heterogeneous-row upgrade if R5b-6b₁ reveals jitter (open #4) |
| R5b-8 | PENDING | Playwright E2E rewrite across R5b surface |
| R5b-9 | PENDING | Pre-merge status report + phone test + merge to main |

R5b-6b split rationale: the original R5b-6 single-commit scope estimated at 300–500 lines. Split into three clusters so each review gate operates on focused scope:
  - **b₁** drag wiring (projects + tasks). Self-contained uses drag.js. ~100–200 lines.
  - **b₂** contentEditable ×3 + long-press + OrphanPicker mount/unmount + orphan UNDO + deleteProject orphan-conversion. ~300–400 lines.
  - **c** commit orchestrator — store-level (onboard.js), not component. ~50–100 lines.

Each ships as its own commit with its own review gate.

## Active decisions that affect remaining R5b work

### Open item #17 — deleteProject orphan-conversion

**Decision:** Option (c) — always convert child tasks to orphans on project delete, no confirm prompt. No new overlay, no window.confirm. Simplest code, safest default. Lands in R5b-6b₂. Upgrade path to window.confirm or inline overlay deferred to post-Phase-4 polish or dogfooding feedback.

### Open item #4 — drag utility heterogeneous-row assumption

**Decision:** pending. R5b-6b₁ implements drag for the project list (heterogeneous heights when projects are expanded) and task lists within each expanded project (uniform heights within a panel). If the project-list drag is jittery when some projects are expanded, choose between (a) upgrade drag.js to cursor-Y-vs-per-row-midpoint, or (b) auto-collapse all projects during drag. Decide during R5b-6b₁ implementation based on observed behavior.

### Open item #19 — R5b-5 byte-accurate pre-commit review gap

R5b-5 (commit cf18a75) landed with partial pre-commit review because the retype-into-chat protocol drifted on a ~550-line CSS file. Three paste-vs-disk discrepancies flagged could not be resolved advisor-side. None would cause build failure. R5b-6 naturally re-reads these files during interaction wiring, so real defects will surface there. If R5b-9 phone test reveals visual defects traceable to CSS, fix in follow-up.

## Review gate protocol (lessons from this session)

Key lesson: the "retype file content into chat" review protocol drifts on multi-hundred-line files. The protocol that works:

1. **Small diffs (< 100 lines, open-item entries, copy-only changes):** inline diff pre-commit is fine. Advisor reviews before commit.
2. **Component-sized diffs (100–500 lines):** Claude Code commits locally first, prints `git show HEAD` as plain chat text directly in message body (NOT via bash/Ran tool output, which renders as UI collapsibles that don't survive copy-paste). Advisor reviews committed bytes. Push only after explicit approval. If advisor finds defects, amend or follow-up commit.
3. **Very large file dumps (> 500 lines, wholesale rewrites):** commit-and-push lands without full byte-accurate advisor review. Follow-up commits surface any real defects. Logged as a tradeoff in open item #19.

Commits happen BEFORE push, as separate operations. Never `git commit && git push` in one step. Push is its own approval gate.

## How we work — advisor / operator / coder

Three-way workflow, clear boundaries:

**Advisor Claude (in the chat — that's you):** senior advisor, architect, reviewer. Thinks, plans, reviews, designs. Does NOT write code directly. Does NOT execute anything. Produces prompts for T.J. to paste into Claude Code. Reviews what Claude Code reports back. Pushes back when Claude Code's proposals have problems. Catches bugs before they land. Thinks about UX, product, architecture — not just code correctness.

**T.J. (operator):** copies advisor's prompts into Claude Code. Copies Claude Code's output back to advisor. Makes final decisions. Phone-tests. Gives advisor findings. Chooses between options advisor presents.

**Claude Code (executor, lives in T.J.'s terminal):** reads files, writes files, runs commands, commits, pushes. Does not design or strategize. Executes prompts from T.J. (originated by advisor). Reports results back to T.J.

## The cycle for every piece of work

1. Advisor proposes a prompt as a copy-paste-ready code block.
2. T.J. pastes to Claude Code. Claude Code works, reports back to T.J.
3. T.J. pastes Claude Code's report back to advisor.
4. Advisor reviews — pushes back if something's wrong, catches issues, approves if clean, refines prompt for next iteration.
5. Based on review, advisor gives next prompt or has T.J. send Claude Code a correction.
6. Repeat until the piece of work is done.

Advisor never writes code, never skips the review gate, never combines multiple steps into a single monolithic prompt that can't be reviewed between sub-steps.

## Preview gate discipline

For any significant change:
- Claude Code reads current state first, reports structure
- Claude Code proposes the diff, stops for T.J.'s approval (which routes through advisor)
- T.J. pastes proposed diff to advisor; advisor reviews
- If approved, T.J. tells Claude Code to apply; if not, advisor refines approach
- After apply, Claude Code runs lint + build gates
- After gates pass, Claude Code commits (separate step from push)
- Claude Code reports commit hash; T.J. pastes to advisor
- Advisor either approves push or requests fix/amendment

Small changes can skip preview (one-line rename, comment fix). Anything touching architecture, state, API surfaces, or user-visible UX goes through full preview discipline.

Commits happen BEFORE push, as separate operations. Never `git commit && git push` in one step. Push is its own approval gate.

## What T.J. expects from advisor specifically

- Prompts as copy-paste-ready code blocks
- Never ask T.J. to explain what Claude Code did — T.J. pastes raw reports, advisor reads directly
- When reviewing Claude Code's output, actually push back on things that look wrong. Don't rubber-stamp.
- When a diff or proposal has problems, be specific about what's wrong and what the fix is
- Catch bugs before they ship
- Treat the product seriously. This app is how T.J. organizes his life. Flaws matter. Copy matters. UX matters.
- Make calls. T.J. is paying advisor to make judgment calls, not round-trip every decision. When decisions are genuinely ambiguous, present options and a recommendation. When they're clear, decide.

## What T.J. does NOT want from advisor

- Advisor trying to directly write, edit, or execute code itself
- Combining "propose + apply + commit" into one go-ahead without review gates
- Designing specs or prompts so terse that Claude Code has to guess at requirements
- Assuming Claude Code got it right without reading its full report
- Skipping the reading/context-loading step at the beginning of a new piece of work
- Asking T.J. for permission on every small decision — advisor is the professional, make the call

## Tone

Direct. No hedging. No excessive disclaimers. No reflexive apology. If advisor is uncertain, advisor says so concretely ("I don't know the state of X, need to check" beats "I'm not 100% sure but I think..."). If advisor made a mistake, acknowledge it and move on — don't self-flagellate.

T.J. curses sometimes; advisor doesn't need to. T.J. is sharp and will push back; advisor pushes back too when it's warranted. Relationship is professional, not deferential.

Avoid bullet-lists when prose is clearer. Reports to T.J. often benefit from prose paragraphs with occasional structured lists for enumeration. Don't default to markdown-heavy output for conversational responses.

Advisor does not refer to itself as "Claude" when distinguishing roles — in this project "Claude" is ambiguous (could mean advisor, Claude Code, Opus 4.7 the extraction model, or Sonnet 4.6 the triage model). Use "advisor" or "I" when the role is self-evident.

## Common session patterns that work

- Start of new piece of work: advisor sends a reading prompt. Claude Code reads relevant files, reports findings. Advisor reviews findings, surfaces conflicts/ambiguities, gets T.J.'s calls on judgment-call items, THEN writes the implementation prompt.
- Preview gate on diffs: Claude Code shows the diff, T.J. pastes to advisor, advisor reviews line-by-line, approves or pushes back.
- Open-item logging: when a concern surfaces that's real but not in current scope, log to vault/build/phase4-open-items.md as its own commit BEFORE the code commit. Keeps the code commit focused.
- Rebasing the session: if the chat is getting long, advisor proactively suggests a handoff to a fresh session rather than burning context on mechanical work.

## Patterns that have caused trouble this session

1. The "retype file content into chat" protocol drifts on large files. For multi-hundred-line files, either commit-then-fetch via GitHub raw URLs (constrained by advisor's web_fetch tool — see open item #19), or accept limited review. Logged as a pattern to learn from.

2. Claude Code sometimes skips steps when asked to do A then B in one prompt — jumps to B without doing A. Mitigation: explicit step gates with "wait for my approval before proceeding." Don't ship multi-step prompts without named gates.

3. Claude Code's UI renders long command output in collapsible blocks that don't survive copy-paste to advisor. Workaround: have Claude Code paste content as response body text directly, not via bash/Ran tool. Still lossy on very large files.

## Governing documents

- **Council 1 spec:** `vault/build/phase4-redesign-spec.md` — data model, backend scope, test plan.
- **Council 2 spec:** `vault/build/phase4-flow-redesign.md` — Council 2 flow redesign, copy manifest, UX architecture.
- **Build log:** `vault/build/PHASES.md` — phase history, approved exceptions, patterns, critical rules.
- **Open items:** `vault/build/phase4-open-items.md` — 19 items as of this handoff; mix of OPEN, SCHEDULED, RESOLVED.

## Environment constraints (unchanged)

Preact + Vite + nanostores + vanilla CSS. No React, no TypeScript, no Tailwind, no component libraries. All design decisions in the council specs respect these constraints.

## Phone test

Not yet conducted for R5b. R5b-9 is the pre-merge gate before phone test. Phone test is T.J.'s job — advisor does not run the flow; advisor helps triage findings.

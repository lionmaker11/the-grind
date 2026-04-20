# .claude/ Folder Configuration Standard
**Status:** Recommended for all Lionmaker projects  
**Source:** Emerging pattern analysis (March 22, 2026, 13 X/Twitter screenshots)  
**Application:** Chief, MARCUS, MCD Command Center, future projects

---

## Overview
Modern Claude Code projects use a `.claude/` folder as the **control plane** for project instructions, custom commands, modular rules, skills, and agent personas. This separates:
- **Committed** (CLAUDE.md) from **personal** (CLAUDE.local.md, gitignored)
- **Instructions** from **extensions** (rules, skills, commands)
- **Team knowledge** from **user overrides**

Result: Portable, scalable project context that works for teams and solo developers.

---

## Directory Structure

```
project-root/
├─ .claude/
│  ├─ CLAUDE.md              # [COMMITTED] Core instructions, mission, tech stack
│  ├─ CLAUDE.local.md        # [GITIGNORED] Personal overrides (T.J.'s local tweaks)
│  ├─ settings.json          # VS Code, Claude Code IDE preferences
│  │
│  ├─ commands/              # Custom slash commands (/project:status, /project:deploy, etc.)
│  │  ├─ status.md           # /project:status — unified project health report
│  │  ├─ deploy.md           # /project:deploy — deployment with security gates
│  │  ├─ review.md           # /project:review — code review checklist
│  │  ├─ fix-issue.md        # /project:fix-issue — issue resolution workflow
│  │  ├─ learn.md            # /project:learn — capture session discoveries
│  │  ├─ new-task.md         # /project:new-task — scaffold from templates
│  │  └─ ...
│  │
│  ├─ rules/                 # Modular rules (auto-invoked on context load)
│  │  ├─ code-style.md       # Naming, formatting, function length limits
│  │  ├─ security.md         # 20+ security rules (see Lionmaker standards)
│  │  ├─ testing.md          # Unit, integration, E2E coverage requirements
│  │  ├─ git.md              # Branch naming, commit message format, PR process
│  │  ├─ api-design.md       # REST conventions, error format, pagination
│  │  └─ ...
│  │
│  ├─ skills/                # Isolated .claude/skills/ structure
│  │  ├─ debugging/
│  │  │  └─ SKILL.md         # Debug methodology (Understand → Isolate → Fix)
│  │  ├─ deployment/
│  │  │  └─ SKILL.md         # Deployment safety gates and rollback
│  │  ├─ architecture/
│  │  │  └─ SKILL.md         # Architecture review process
│  │  └─ ...
│  │
│  └─ agents/                # Subagent personas (isolated sessions)
│     ├─ architect.md        # Architecture specialist — design, patterns, edge cases
│     ├─ reviewer.md         # Code reviewer — security, style, tests
│     ├─ qa.md               # QA specialist — browser testing, edge cases
│     └─ ...

├─ .gitignore               # Include: .claude/CLAUDE.local.md, .claude/settings.json
├─ [source code...]
└─ [tests, docs, etc...]
```

---

## CLAUDE.md (Committed Core)

This is what the project **requires** every contributor to know.

**Sections:**
```markdown
# [Project Name]

## Mission
[Clear goal in 2-3 sentences]

## Technology Stack
[Languages, frameworks, databases, deployment, CI/CD]

## Project Structure
[Tree of directories + what they do]

## Key Decisions
[Locked decisions: chosen tools, patterns, non-negotiables]

## Getting Started
[How to clone, install deps, run locally]

## Development Workflow
[Branch strategy, how to run tests, how to submit PRs]

## Read These First
[Links to this project's .claude/rules/*, skills/*, security.md]
```

---

## CLAUDE.local.md (Gitignored Personalization)

**Purpose:** Overrides and personal preferences that don't apply to the whole team.

**Example:**
```markdown
# Local Overrides (T.J.'s personal preferences)

## Model & Thinking
- Use Sonnet 4.6 for architecture decisions (not Haiku)
- Enable extended thinking for complex refactors

## Development
- Use iTerm2 + tmux, not default terminal
- Email deployment summaries to thomas@lionmaker.io
- Slack critical errors to @lionmaker-alerts

## Logging
- Log all token spend to ~/Marcusv2/logs/token-spend.log
- Log all deployments to ~/Marcusv2/logs/deployments.log
```

---

## Commands/ — Custom Slash Commands

Each `.md` file is a prompt that activates when typed as `/project:command`.

### Example: /project:status
```markdown
# /project:status — Project Health Report

Read the latest status file for this project.
Output format:
- [ ] Build status (tests passing?)
- [ ] Deployment status (latest deploy success/fail)
- [ ] Open blockers (security, performance, dependency)
- [ ] Next milestone
- [ ] Token spend this week

Reference: [project]/status.md
```

### Recommended Commands for All Projects
1. `/project:status` — unified project health (tests, deploy, blockers, next steps)
2. `/project:deploy` — safe deployment (all security gates, changelog, rollback plan)
3. `/project:review` — code review checklist (security, style, tests, performance)
4. `/project:fix-issue ISSUE_ID` — walk through issue fix process
5. `/project:learn SESSION_SUMMARY` — capture session discoveries to memory
6. `/project:new-task TASK_NAME` — scaffold new feature/fix from template

---

## Rules/ — Modular Standards

Each `.md` file is a set of rules that applies to the entire project.

### Recommended Rules for All Projects
- **code-style.md** — Naming conventions, line length, function size, comment style
- **security.md** — The 20 Lionmaker security rules + project-specific additions
- **testing.md** — Coverage targets (80% minimum, 100% for security paths), test structure
- **git.md** — Branch naming (feature/, fix/), commit messages (feat:, fix:), PR process
- **api-design.md** — REST conventions, error format, pagination, rate limiting

---

## Skills/ — Isolated Expertise

Each skill can be invoked as a specialized subagent.

### Example: debugging/SKILL.md
```markdown
# Debugging Skill

When a bug is discovered:

1. **UNDERSTAND**: Restate the issue, read actual error, check logs, reproduce
2. **ISOLATE**: Binary search for failing component, form hypothesis
3. **FIX**: Minimal targeted fix, verify, check for regressions

Never guess. Always follow the methodology.
```

---

## Agents/ — Subagent Personas

Each `.md` defines how to spawn a specialized agent for a specific task.

### Example: architect.md
```markdown
# Architecture Specialist Subagent

Use when:
- Designing new features (edge cases, failure modes)
- Evaluating refactoring approaches
- Reviewing major PRs for architectural soundness

Spawn with:
```
claude-code --agent architect --task "Design X"
```

Instructions:
- Think in terms of failure modes, scaling, and future changes
- Diagram the solution (text-based)
- Identify edge cases before implementation
```

---

## Implementation for Lionmaker Projects

### Chief (AI PM System)
Create `.openclaw/chief/.claude/` with:
```
commands/
├─ chief:status.md        # Unified status across all managed projects
├─ chief:new-project.md   # Scaffold new Lionmaker project
└─ chief:sync.md          # Force Basecamp ↔ Calendar sync

rules/
├─ pm-workflow.md         # How Chief manages projects, assigns work
├─ basecamp.md            # Basecamp API integration rules
└─ estimation.md          # Task sizing and Pomodoro allocation

skills/
├─ basecamp/SKILL.md      # Basecamp API operations
├─ calendar/SKILL.md      # Google Calendar operations
├─ telegram/SKILL.md      # Telegram messaging and formatting
└─ project-planning/SKILL.md # Office hours → Review → Build → QA → Ship
```

### MARCUS (Trading System)
Create `Marcusv2/.claude/` with:
```
commands/
├─ marcus:status.md       # Trading system health, live positions, P&L
├─ marcus:test.md         # Run backtests, verify anti-overfit
├─ marcus:deploy.md       # Deployment to LIVE with safety gates
└─ marcus:learn.md        # Capture session discoveries

rules/
├─ trading-safety.md      # Position limits, risk gates, shadow testing
├─ backtesting.md         # Walk-forward validation, anti-overfit checks
└─ deployment.md          # Zero-tolerance for bugs in live trading

skills/
├─ postgres/SKILL.md      # Railway database queries
├─ hyperliquid/SKILL.md   # Read-only exchange operations
└─ git-workflow/SKILL.md  # GitHub PR process with CI gates
```

### MCD Command Center (GrillaHQ)
Create `MCDCommand/.claude/` with:
```
commands/
├─ grilla:status.md       # Multi-tenant status, active orgs, SMS volume
├─ grilla:deploy.md       # Safe deployment with zero-downtime migration
└─ grilla:new-feature.md  # Feature scaffolding for new pipeline stages

rules/
├─ multi-tenant.md        # organizationId required on all queries
├─ safety.md              # Webhook validation, SMS compliance, DNC checking
└─ ui-patterns.md         # shadcn/ui dark theme conventions

skills/
├─ postgres-multi-tenant/SKILL.md
├─ stripe/SKILL.md        # Billing and subscription operations
└─ bullmq/SKILL.md        # Job queue and retry logic
```

---

## Benefits

| Benefit | Example |
|---------|---------|
| **Portability** | Clone any project, read `.claude/CLAUDE.md`, ready to work |
| **Scalability** | New team member? Give them CLAUDE.md, they have project context |
| **Consistency** | All projects follow same structure, easier to switch between them |
| **Reusability** | Skills and rules can be copied to new projects |
| **Flexibility** | CLAUDE.local.md allows personal overrides without breaking team |
| **Discoverability** | All custom commands, rules, skills in one place |
| **Version Control** | CLAUDE.md committed, CLAUDE.local.md gitignored = clean history |

---

## Next Steps

1. Implement `.claude/` structure in Chief (currently missing)
2. Implement `.claude/` structure in MARCUS (currently missing)
3. Implement `.claude/` structure in MCD Command Center (currently missing)
4. Create master project template at `~/.lionmaker/project-templates/master/` with this structure
5. Use template for all future Lionmaker projects

---

## References
- **Emerging Pattern Analysis:** 13 X/Twitter screenshots analyzed March 22, 2026 (10 discoveries, 7 categories)
- **Implementations to Study:**
  - Claude as life/project management interface (10-agent Obsidian crew, 864 likes)
  - Paperclip effect (avoid; build natively instead)
  - Mobile vault access (Claude Code + Obsidian + Channels + phone alerts)

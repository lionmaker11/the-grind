# PROJECT TEMPLATE — New Claude Code / OpenClaw Instance

> Use this template every time T.J. spins up a new project. Copy this entire folder structure into the new project directory. This ensures every project is vault-aware and cross-connected.

---

## Folder Structure for New Projects

```
~/[project-name]/
├── CLAUDE.md              ← Project-specific Claude Code instructions
├── AGENTS.md              ← OpenClaw agent definition (if using OpenClaw)
├── memory.md              ← Project-specific memory (session learning)
├── .claude/
│   └── settings.json      ← MCP config (gitignored)
├── src/                   ← Source code (if applicable)
├── docs/                  ← Project documentation
└── .mcp.json              ← MCP server config (gitignored)
```

---

## CLAUDE.md Template (Copy and Customize)

```markdown
# CLAUDE.md — [PROJECT NAME]

## Project Identity
You are working on **[PROJECT NAME]** for T.J. Typinski.
[One paragraph describing what this project is and what success looks like.]

## Vault Awareness — CRITICAL
This project is connected to T.J.'s central Obsidian vault at `~/Documents/lionmaker-vault/`.

### Before Starting Any Work:
1. Read `~/Documents/lionmaker-vault/CLAUDE.md` for T.J.'s global operating context.
2. Read `~/Documents/lionmaker-vault/NORTH_STAR.md` to understand priorities and values.
3. Read `~/Documents/lionmaker-vault/projects/[this-project]/STATUS.md` for project-specific context.
4. Check `~/Documents/lionmaker-vault/action-items/ACTIVE.md` for any open items related to this project.

### During Work:
- If you make a decision → log it to `~/Documents/lionmaker-vault/decisions/YYYY-MM-DD-[name].md`
- If you learn something about a person → update `~/Documents/lionmaker-vault/people/[name].md`
- If project status changes → update `~/Documents/lionmaker-vault/projects/[this-project]/STATUS.md`
- If you create a task → add it to `~/Documents/lionmaker-vault/action-items/ACTIVE.md`
- If financial info surfaces → update `~/Documents/lionmaker-vault/FINANCES.md`

### After Work:
- Write a session summary to `~/Documents/lionmaker-vault/daily-briefs/YYYY-MM-DD.md` (append, don't overwrite)
- Update `~/Documents/lionmaker-vault/_meta/CHANGELOG.md` with significant changes

## Project-Specific Context
[Add project details here: architecture, tech stack, current status, blockers, etc.]

## Build Etiquette
[For MARCUS: mandatory three-agent council. For other projects, adapt as needed.]

## Connected Projects
- [[~/Documents/lionmaker-vault/projects/[related-project-1]/STATUS.md]]
- [[~/Documents/lionmaker-vault/projects/[related-project-2]/STATUS.md]]

## MCP Connections
[List MCPs this project uses: GitHub, PostgreSQL, Hyperliquid, etc.]
```

---

## AGENTS.md Template (For OpenClaw Instances)

```markdown
# AGENTS.md — [PROJECT NAME] OpenClaw Agent

## Identity
You are the [ROLE] agent for [PROJECT NAME], operating under T.J. Typinski's Lionmaker Systems.

## Vault Awareness
Your central brain lives at `~/Documents/lionmaker-vault/`. Before any autonomous action:
1. Read `~/Documents/lionmaker-vault/CLAUDE.md` for global context.
2. Read `~/Documents/lionmaker-vault/projects/[this-project]/STATUS.md` for project state.
3. Read `~/Documents/lionmaker-vault/NORTH_STAR.md` to ensure alignment with T.J.'s values.

## Memory
- Project-specific memory: `./memory.md` (this directory)
- Global memory: `~/Documents/lionmaker-vault/MEMORY.md`
- After every significant action, update BOTH memory files.

## Skills
[List project-specific skills or reference `~/Documents/lionmaker-vault/skills/` for global skills]

## Safety
- Never execute financial transactions without T.J.'s explicit approval.
- Never delete or overwrite vault files without T.J.'s approval.
- Never modify `~/Documents/lionmaker-vault/NORTH_STAR.md` without T.J.'s explicit direction.
- Log all autonomous actions to `~/Documents/lionmaker-vault/daily-briefs/YYYY-MM-DD.md`.

## Reporting
- Push status updates to Telegram @rocha11_bot
- Log all significant actions to the vault
```

---

## memory.md Template

```markdown
# memory.md — [PROJECT NAME] Session Memory

> This file stores project-specific learnings, preferences, and decisions across sessions.
> Global memory lives at ~/Documents/lionmaker-vault/MEMORY.md — update both when appropriate.

## Project Preferences
_(Agent: log project-specific preferences here as you learn them)_

## Session Log
_(Agent: append session summaries here)_

## Patterns Observed
_(Agent: log recurring patterns specific to this project)_
```

---

## How to Spin Up a New Project

### Claude Code:
```bash
# 1. Create project directory
mkdir -p ~/[project-name]
cd ~/[project-name]

# 2. Copy template files
cp ~/Documents/lionmaker-vault/_templates/CLAUDE_TEMPLATE.md ./CLAUDE.md
cp ~/Documents/lionmaker-vault/_templates/memory_TEMPLATE.md ./memory.md

# 3. Customize CLAUDE.md with project-specific details

# 4. Create project folder in vault
mkdir -p ~/Documents/lionmaker-vault/projects/[project-name]
# Create STATUS.md and CLAUDE.md in that folder

# 5. Launch Claude Code
claude
```

### OpenClaw:
```bash
# 1. Create project directory
mkdir -p ~/[project-name]
cd ~/[project-name]

# 2. Copy template files
cp ~/Documents/lionmaker-vault/_templates/AGENTS_TEMPLATE.md ./agents.md
cp ~/Documents/lionmaker-vault/_templates/memory_TEMPLATE.md ./memory.md

# 3. Customize agents.md with role and project details

# 4. Create project folder in vault
mkdir -p ~/Documents/lionmaker-vault/projects/[project-name]

# 5. Start OpenClaw in this directory
openclaw start
```

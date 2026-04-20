# CROSS-AWARENESS ARCHITECTURE — How Everything Connects Through Obsidian

> This document explains how Chief, Claude Code instances, and OpenClaw agents all share awareness through the central Obsidian vault.

---

## The Principle

Every AI instance T.J. runs — whether it's Chief on OpenClaw, a Claude Code session building MARCUS, or a new agent working on BiggerSpreads — reads from and writes to the SAME central vault at `~/Documents/lionmaker-vault/`.

This means:
- **Chief** knows what the MARCUS agent built last night.
- **MARCUS agent** knows T.J.'s financial situation and won't propose expensive infrastructure.
- **Motor City Deals agent** knows the 708 Pallister timeline and won't schedule conflicting contractor calls.
- **Every agent** knows T.J.'s values, priorities, and growth vectors from NORTH_STAR.md.

No agent operates in a silo. The vault IS the shared brain.

---

## Architecture Diagram

```
                    ┌─────────────────────────┐
                    │   ~/Documents/lionmaker-vault/         │
                    │   (Obsidian Vault)        │
                    │                           │
                    │  CLAUDE.md  MEMORY.md     │
                    │  NORTH_STAR.md            │
                    │  FINANCES.md              │
                    │  people/  projects/       │
                    │  skills/  decisions/      │
                    │  daily-briefs/            │
                    │  action-items/            │
                    └─────────┬────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              │               │                   │
    ┌─────────▼──────┐ ┌─────▼───────┐ ┌────────▼────────┐
    │ Chief           │ │ MARCUS      │ │ MCD Agent       │
    │ (OpenClaw)      │ │ (Claude     │ │ (Claude Code    │
    │                 │ │  Code)      │ │  or OpenClaw)   │
    │ Life OS         │ │             │ │                 │
    │ Accountability  │ │ Trading     │ │ Lead Gen        │
    │ Scheduling      │ │ Pine Script │ │ Deals           │
    │ Financial       │ │ Railway     │ │ GoHighLevel     │
    │ Monitoring      │ │ PostgreSQL  │ │ Facebook Group  │
    └────────────────┘ └─────────────┘ └─────────────────┘
              │               │                   │
              └───────────────┼───────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  Telegram @rocha11_bot    │
                    │  (All agents report here) │
                    └──────────────────────────┘
```

---

## Read/Write Rules by Agent Type

### Chief (OpenClaw — Life OS)
**Reads:** Everything in the vault. Chief is the GM.
**Writes:** Everything. Chief has full write access to all vault files.
**Owns:** `MEMORY.md`, `NORTH_STAR.md`, `FINANCES.md`, `action-items/`, `daily-briefs/`, `skills/`, `_meta/`

### Project Agents (Claude Code — MARCUS, BiggerSpreads, MCD, etc.)
**Reads:** Global files (`CLAUDE.md`, `MEMORY.md`, `NORTH_STAR.md`, `FINANCES.md`) + their own `projects/[name]/` folder.
**Writes:** Their own `projects/[name]/` folder + `decisions/` + `daily-briefs/` (append only) + `action-items/` (add items).
**Does NOT write:** `MEMORY.md`, `NORTH_STAR.md`, `FINANCES.md`, other projects' folders, `people/` (except to add new people).

### Specialist Agents (e.g., Cannabis, Content, Research)
**Reads:** Global files + their specific domain folder.
**Writes:** Their domain folder + `daily-briefs/` (append only).
**Does NOT write:** Core vault files or other domains.

---

## How a New Agent Gets Vault Awareness

When spinning up ANY new Claude Code or OpenClaw instance:

1. **Copy the project template** from `~/Documents/lionmaker-vault/_templates/PROJECT_TEMPLATE.md`
2. **Customize the CLAUDE.md** (or AGENTS.md) with:
   - Vault path: `~/Documents/lionmaker-vault/`
   - Which global files to read on startup
   - Which project folder is theirs
   - Read/write permissions
   - Connected projects (cross-references)
3. **Create the project folder in the vault**: `mkdir -p ~/Documents/lionmaker-vault/projects/[name]`
4. **Add STATUS.md and CLAUDE.md** to that project folder
5. **Update the master MEMORY.md** to include the new project in the ventures table
6. **Update CLAUDE.md at vault root** to list the new agent under Connected Tools

---

## Cross-Project Awareness Examples

### MARCUS needs to know about finances
MARCUS reads `~/Documents/lionmaker-vault/FINANCES.md` to understand T.J.'s financial constraints. If T.J. has $500 to invest, MARCUS doesn't propose a strategy requiring $5,000.

### Motor City Deals needs to know about 708 Pallister schedule
MCD agent reads `~/Documents/lionmaker-vault/projects/708-pallister/STATUS.md` to avoid scheduling deal showings during contractor check-ins.

### BiggerSpreads needs to know if it should even exist
BiggerSpreads agent reads `~/Documents/lionmaker-vault/NORTH_STAR.md` and sees "active projects > 3 → push back hard." It reads `MEMORY.md` and sees T.J.'s own doubt about the product. It flags this to Chief.

### Chief orchestrates everything
Chief reads ALL project STATUS files at Sunday planning. If MARCUS had a good week and MCD had a bad week, Chief adjusts next week's Trello accordingly. If 708 Pallister is stalling, Chief escalates in the morning brief.

---

## Conflict Resolution

When two agents disagree or have competing needs:
1. **NORTH_STAR.md is the tiebreaker.** Always.
2. **Chief has final say** on scheduling and priority conflicts.
3. **No agent modifies another agent's project folder** without going through Chief.
4. **All conflicts get logged** to `decisions/` with rationale.

---

## Future Expansion

As T.J. adds more agents, each one gets:
1. Its own project directory in the vault
2. Its own CLAUDE.md / AGENTS.md pointing to the vault
3. A row in MEMORY.md's ventures table
4. Cross-links to related projects
5. Awareness of NORTH_STAR.md so it stays aligned

The vault grows. The agents multiply. But the NORTH_STAR stays constant. That's the architecture.

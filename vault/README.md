# Lionmaker Vault — Organizational Brain

This is the central knowledge base for all of Lionmaker Systems. Every AI instance — Chief (OpenClaw), Claude Code project sessions, and future agents — reads from and writes to this vault. It replaces flat memory files with a structured, cross-linked Obsidian knowledge graph that compounds over time.

## How the Vault Works

**Chief** (OpenClaw) is the GM — full read/write access. Manages daily operations, accountability, scheduling, finances.
**Project agents** (Claude Code) read global context + write to their own project folders.
**NORTH_STAR.md** is the universal tiebreaker for any conflict between agents or priorities.

**On every session start:** Chief reads `MEMORY.md` (index) + any files relevant to the current context.
**On every session end:** Chief updates any files that changed and logs the day's brief.
**On Sunday planning:** Chief reviews the full vault, prunes stale content, promotes patterns.

## Structure

```
lionmaker-vault/
├── MEMORY.md              ← Master index (T.J.'s identity, patterns, ventures, people)
├── NORTH_STAR.md          ← Values, priority stack, growth vectors, quarterly review
├── FINANCES.md            ← Income, bills, obligations, monthly revenue log
├── README.md              ← You are here
├── people/                ← Living context on every person Chief interacts with
│   ├── ali.md
│   ├── rick.md
│   ├── aurelia.md
│   └── (more added over time)
├── projects/              ← Per-project context, decisions, status
│   ├── marcus/STATUS.md
│   ├── 708-pallister/STATUS.md
│   ├── biggerspreads/STATUS.md
│   ├── motor-city-deals/STATUS.md
│   ├── ai-baseline/STATUS.md
│   └── lionmaker/STATUS.md
├── skills/                ← Repeatable processes Chief can invoke by name
│   ├── morning-brief.md
│   ├── meeting-prep.md
│   ├── log-decision.md
│   ├── vault-maintenance.md
│   ├── sunday-planning.md
│   ├── pallister-checkin.md
│   └── process-transcript.md
├── decisions/             ← Structured decision records with rationale
│   └── TEMPLATE.md
├── daily-briefs/          ← Daily summaries (auto-generated, pruned at 30 days)
│   └── 2026-03-20.md
├── action-items/          ← Tracked action items by owner
│   └── ACTIVE.md
└── cannabis/              ← Grow logs, strain notes, tent status
    └── grow-log.md
```

## Rules

1. Chief WRITES to this vault. T.J. never has to manually edit anything.
2. Files are markdown. Cross-link with `[[filename]]` syntax.
3. Daily briefs older than 30 days get archived to `daily-briefs/archive/`.
4. Decisions are permanent — never deleted, only appended with updates.
5. People files grow with every interaction — Chief adds context after meetings/calls.
6. If T.J. opens this in Obsidian, all links and structure just work.

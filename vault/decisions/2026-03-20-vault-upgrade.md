---
aliases: [Vault Upgrade Decision]
date: 2026-03-20
project: chief
tags: [decision]
---

# Decision: Replace flat MEMORY.md with structured vault

## Context
Chief was running on a single flat MEMORY.md file that grew unwieldy. Context was getting lost between sessions. No way for T.J. to visually inspect what Chief knows.

## Options Considered
1. **Keep flat MEMORY.md** — simple but doesn't scale, no visual inspection
2. **Structured vault directory** — Obsidian-compatible, graph view, cross-linked files
3. **Database-backed system** — overkill for current needs

## Decision
Option 2. Built the Lionmaker Vault at `~/Documents/lionmaker-vault/` with people/, projects/, skills/, decisions/, daily-briefs/ structure.

## Expected Outcome
- T.J. can open Obsidian and see Chief's entire brain visually
- Nothing gets lost between sessions
- Cross-links make relationships explicit

## Follow-ups
- [ ] Daily briefs populated consistently
- [ ] Weekly vault maintenance during Sunday planning

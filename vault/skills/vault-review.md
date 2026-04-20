---
name: vault-review
description: "Vault Review"
---

# Skill: Vault Review

## Trigger
T.J. says "review the vault" or "/vault-review" or Chief triggers after every 10th session.

## Process
1. Scan all vault files for staleness:
   - `people/` files with no updates in 30+ days → flag for review
   - `projects/` STATUS files with no updates in 14+ days → flag
   - [[ACTIVE]] items older than 2 weeks → flag for kill or reschedule
   - [[FINANCES]] with unknown amounts → flag for T.J. to clarify

2. Check for missing connections:
   - Are there people mentioned in `projects/` that don't have `people/` files?
   - Are there decisions referenced that don't have `decisions/` entries?
   - Are there action items without owners or dates?

3. Check CLAUDE.md accuracy:
   - Does the vault architecture section match actual folder structure?
   - Are all skills listed? Any new ones need adding?
   - Are MCP connections still accurate?

4. Check [[MEMORY]] accuracy:
   - Do venture statuses reflect reality?
   - Is the priority ranking still accurate?
   - Any patterns to add or remove from "Patterns to Watch"?

5. Check [[NORTH_STAR]] alignment:
   - Has T.J. expressed any value shifts recently?
   - Is the $25K/month target still the number?
   - Any growth vectors that need updating?

6. Propose changes to T.J.:
   - "Here's what's stale: [list]"
   - "Here's what's missing: [list]"
   - "Here's what I'd update: [list]"
   - Wait for T.J.'s approval before making changes.

## Rules
- Never delete vault content without T.J.'s explicit approval.
- This is an audit, not a cleanup. Show T.J. what needs attention, let him decide.
- If the vault has grown too large or cluttered, propose a restructure plan.

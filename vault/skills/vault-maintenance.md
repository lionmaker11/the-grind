---
name: vault-maintenance
description: "Vault Maintenance"
---

# Skill: Vault Maintenance

## Trigger
- Every heartbeat cycle (30 min)
- Before any session end or compaction
- Sunday planning review

## Heartbeat (every 30 min)
1. Check if today's daily brief exists in `daily-briefs/YYYY-MM-DD.md`. Create if missing.
2. Append summary of what was discussed/done since last heartbeat to today's brief.
3. Update any `people/` files if new context was learned about someone.
4. Update any `projects/` STATUS.md files if project work happened.
5. Update `action-items/` if new items were created or completed.

## Pre-Compaction Flush
Before the session compresses, write ALL unlogged context to the vault. Nothing gets lost silently.

## Sunday Maintenance
1. Review all `daily-briefs/` from the past week → identify patterns.
2. Promote recurring patterns to [[MEMORY]] (e.g., "T.J. consistently skips Wednesday strategy block").
3. Archive daily briefs older than 30 days to `daily-briefs/archive/`.
4. Review `action-items/` → flag items older than 1 week. Kill or reschedule items older than 2 weeks.
5. Update [[MEMORY]] patterns section with any new observations.
6. Check financial tracking — any bills mentioned this week that need recurring reminders?

## Rules
- Chief WRITES to the vault. T.J. never has to manually edit anything.
- If in doubt, log it. Better to have too much context than too little.
- The vault is Chief's brain. If it's not in the vault, Chief doesn't know it next session.

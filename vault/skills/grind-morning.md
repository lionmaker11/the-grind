---
name: grind-morning
description: Read yesterday's Grind results and inject performance context into morning brief
version: 2.0
---

## Purpose
Read yesterday's Grind results from GitHub, compute yesterday's score and streak status,
and write a performance summary to the cache for the morning-brief skill to pick up.

## Steps

1. Compute yesterday's date (YYYY-MM-DD format)
2. Fetch yesterday's results: `gh api repos/lionmaker11/the-grind/contents/results/YESTERDAY.json --jq '.content' | base64 -d`
3. Parse: extract score, task completion count, categories worked, pomodoro count
4. Fetch the last 7 days of results to compute streak and rolling average
5. Compute delta vs 7-day rolling average
6. Generate a performance snapshot:
   - "Yesterday: [SCORE]/100 ([COMPLETED]/[TOTAL] tasks, [POMODOROS] pomodoros)"
   - "Streak: [N] days"
   - "Trend: [up/down/flat] vs 7-day avg of [AVG]"
   - Category balance: which of the 7 life categories got attention, which didn't
7. Write snapshot to ~/.hermes/cache/grind-morning-context.md
8. If score was below 40: add a note "Low day — check in on energy/blockers during brief"
9. If streak is at risk (yesterday 35-49): add "Streak risk — front-load one quick win today"
10. If any category got zero attention for 3+ consecutive days: flag it

## Integration
- The morning-brief skill reads ~/.hermes/cache/ during its vault scan
- This skill runs BEFORE morning-brief in the cron job skills array
- Do NOT send Telegram messages — the morning-brief handles all delivery

## Rules
- If no results found for yesterday (Sunday, off day), note it calmly without alarm
- Always write the cache file even if empty (prevents stale data from previous day)
- Include a timestamp in the cache file header

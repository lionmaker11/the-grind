---
name: weekly-client-report
description: Generate weekly client status reports from Basecamp + Grind data
version: 1.0
---

## Purpose
Every Friday at 5 PM, generate client-ready status reports for each active Basecamp project.
Combines Basecamp project data with Grind execution metrics for a complete picture.

## Steps

1. Run `python3 ~/.hermes/scripts/basecamp_sync_cron.py --report-only` to get current project health
2. For each active Basecamp project:
   a. Fetch completed todos this week (updated_at > Monday 00:00)
   b. Fetch in-progress todos (assigned, not done, not blocked)
   c. Fetch overdue todos (past due date)
   d. Identify blocked items and reasons
   e. Find next milestone / due date

3. Cross-reference with Grind data:
   - How many Grind tasks mapped to this project this week?
   - What was the completion rate for project-specific tasks?
   - Were there any days this project got zero attention?

4. Cross-reference with vault project status files:
   - ~/Documents/lionmaker-vault/projects/[project]/[project]-status.md
   - Pull latest decisions, blockers, stakeholder notes

5. Format each project report:
   ```markdown
   ### [Project Name]
   **Status:** [On Track / At Risk / Blocked]
   **Done this week:**
   - [completed items]
   **In Progress:**
   - [active items with assignees]
   **Blocked:**
   - [blocked items with reasons, or "Nothing blocked"]
   **Next milestone:** [date + description]
   **Grind velocity:** [X tasks completed, Y% of planned]
   ```

6. Write full report to ~/Documents/lionmaker-vault/reports/YYYY-MM-DD-weekly.md
7. Send Telegram summary: "Weekly report ready. [N] projects covered. Review in vault."

## Rules
- Only include projects with activity this week or overdue items
- If Basecamp circuit breaker is open, note it and use cached data
- Keep individual project sections under 200 words
- Flag any project with 0 completions this week as "At Risk"
- Include a 1-line Grind performance note at the top: "Team velocity: [avg score]/100"

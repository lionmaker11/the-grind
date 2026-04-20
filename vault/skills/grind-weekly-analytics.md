---
name: grind-weekly-analytics
description: Compute weekly Grind analytics for Sunday planning session
version: 1.0
---

## Purpose
Generate a comprehensive weekly Grind performance report for the Sunday planning session.
Runs before the sunday-planning skill to provide data-driven context.

## Steps

1. Fetch results for the last 7 days from GitHub:
   `gh api repos/lionmaker11/the-grind/contents/results/YYYY-MM-DD.json --jq '.content' | base64 -d`
   (Loop for each day Mon-Sat)

2. Compute weekly metrics:
   - **Total score:** Sum of all daily scores
   - **Average score:** Mean daily score
   - **Best day:** Highest scoring day + what made it good
   - **Worst day:** Lowest scoring day + what went wrong
   - **Completion rate:** Total tasks completed / total tasks assigned
   - **Pomodoro count:** Total pomodoros completed
   - **Streak:** Current streak length and longest streak this week

3. Compute category balance across the 7 life categories:
   - Physical, Mental, Spiritual, On the Business, In the Business, Finances, Relationships
   - Percentage of tasks per category
   - Flag any category with 0% (completely neglected)
   - Flag any category with >50% (over-indexed)

4. Compute trends:
   - This week vs last week (score delta, completion delta)
   - If available, this week vs 4-week rolling average

5. Generate recommendations:
   - Categories to prioritize next week
   - If average score <60: suggest lighter queue or identify blockers
   - If average score >80: suggest pushing harder on stretch goals
   - If one category dominates: suggest rebalancing

6. Write full report to ~/.hermes/cache/grind-weekly.md

## Format
```markdown
# Weekly Grind Report — [Week of DATE]

## Score: [AVG]/100 (Δ [+/-X] vs last week)
Completion: [X]% | Pomodoros: [N] | Streak: [N] days

## Daily Breakdown
| Day | Score | Tasks | Focus |
|-----|-------|-------|-------|
| Mon | ...   | ...   | ...   |

## Category Balance
[Bar chart using text: ████░░░░░░ 40% Physical]

## Recommendations
- ...
```

## Rules
- Run on Sunday before 6 PM (ahead of sunday-planning cron)
- Always produce output even if some days have no data
- Write to cache file — sunday-planning reads it automatically

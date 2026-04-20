---
name: project-sync
description: "Project Sync"
---

# Skill: Project Sync

## Trigger
After any coding agent session completes on a Lionmaker project (MARCUS, GrillaHQ, MCD Command Center, Alex OpenClaw).

## Process
1. Read the agent's output / session summary.
2. Update the project's status file in `projects/[project]/[project]-status.md`:
   - What was built or changed
   - Current blockers
   - Next steps
3. If the work involved a person (Ali, Sam, Alex), update their `people/` file with interaction context.
4. If a decision was made during the build, create a `decisions/` entry.
5. If financial implications (hosting costs, API keys, subscriptions), update [[FINANCES]].
6. Update today's `daily-briefs/YYYY-MM-DD.md` with what shipped.
7. Cross-link: if work on Project A affects Project B (e.g., MCD command center uses MARCUS trading data), add a link between both status files.

## Cross-Project Links to Maintain
- [[motor-city-deals-status|MCD]] ↔ GrillaHQ (command center is the MCD lead gen engine)
- [[motor-city-deals-status|MCD]] ↔ [[marcus-status|MARCUS]] (MCD revenue funds .75 BTC goal)
- [[motor-city-deals-status|MCD]] ↔ [[ali|Ali]] (daily partner)
- [[708-pallister-status|Pallister]] ↔ [[sam-haidar|Sam]] (daily contractor)
- [[708-pallister-status|Pallister]] ↔ [[rick|Rick]] (financial partner)
- [[708-pallister-status|Pallister]] ↔ [[FINANCES]] (rehab draws, contractor payments)

## Rules
- Every coding session that ships something = vault update. No exceptions.
- Status files should reflect reality within 1 hour of a build completing.
- If a project's status hasn't been updated in 7+ days, flag during morning brief.

---
name: log-decision
description: "Log Decision"
---

# Skill: Log Decision

## Trigger
T.J. says "log decision about [X]" or Chief identifies a significant decision was made in conversation.

## Process
1. Discuss context with T.J. if not already clear.
2. Create new file: `decisions/YYYY-MM-DD-short-name.md` using TEMPLATE.md format.
3. Fill in: context, options considered, what was chosen and why, expected outcome, follow-ups.
4. Update relevant `projects/` STATUS.md with reference to the decision.
5. Update [[MEMORY]] recent decisions list (keep top 5).
6. If decision involves a person, update their `people/` file.
7. Confirm to T.J. via Telegram: "Decision logged: [title]. Follow-ups: [list]."

## Rules
- Decisions are permanent. Never deleted.
- Always capture the alternatives that were rejected and WHY.
- This is the "receipt" system. When someone asks "why did we do X?" — this is the answer.

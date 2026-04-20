---
name: process-transcript
description: "Process Meeting Transcript"
---

# Skill: Process Meeting Transcript

## Trigger
T.J. pastes a meeting transcript or says "process this call."

## Process
1. Identify who was in the meeting.
2. Create/update `people/` file for each participant with new context learned.
3. Extract action items with owners → add to `action-items/`.
4. Extract any decisions made → create `decisions/` entry if significant.
5. Update relevant `projects/` STATUS.md with meeting outcomes.
6. Create meeting notes summary in `daily-briefs/` for today.
7. Push summary to Telegram: "[Meeting with X] — Key takeaways: [3 bullets]. Action items: [list with owners]."

## Rules
- T.J. should never have to tell Chief where to file things. Chief figures it out from context.
- Keep the Telegram summary to one phone screen.
- Action items MUST have owners and rough deadlines.
- If a decision was made, always capture the alternatives that were rejected.

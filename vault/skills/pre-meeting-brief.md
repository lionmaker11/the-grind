---
name: pre-meeting-brief
description: Generate a pre-meeting dossier for a specific person or company
version: 1.0
---

## Purpose
When T.J. is about to meet someone, generate a concise 1-page brief with everything
Chief knows about them, their projects, and what to discuss.

## Trigger
- Telegram command: `/brief [person name]`
- Cron: Can be added to calendar sync to auto-trigger before calendar events
- Manual: T.J. says "brief me on [person]" or "prep for meeting with [person]"

## Steps

1. **Find person in vault:**
   - Search ~/Documents/lionmaker-vault/people/ for matching file
   - If not found, search MEMORY.md and SHARED_CONTEXT.md for mentions
   - If still not found, note "New contact — no prior history"

2. **Enrich if stale:**
   - Check the person file's last-updated date
   - If older than 7 days, run intel-enrichment:
     - Search web for their name + company
     - Check LinkedIn profile (if URL in vault)
     - Check recent news mentions
   - Save enrichment to vault person file

3. **Pull project context:**
   - Find all Basecamp projects where this person is mentioned or assigned
   - Pull active todos, recent completions, and blockers
   - Check decisions/ for any decisions involving this person

4. **Pull action items:**
   - Check action-items/ACTIVE.md for items assigned to or involving this person
   - Check for overdue items (flag prominently)

5. **Generate brief:**
   ```markdown
   # Meeting Brief: [Person Name]
   **Company:** [company] | **Role:** [role]
   **Last interaction:** [date + context]
   **Relationship status:** [active project / dormant / new]

   ## What we're working on together
   - [project summaries with status]

   ## Open items for discussion
   - [action items, overdue items, decisions needed]

   ## Talking points
   - [2-3 suggested topics based on project status and recent events]

   ## Background
   - [Key facts: how we met, past projects, their priorities, communication style]
   ```

6. **Deliver:**
   - Send full brief to Telegram
   - Save to ~/Documents/lionmaker-vault/daily/meeting-briefs/YYYY-MM-DD-[person].md

## Rules
- Keep the brief under 500 words — T.J. reads this right before the meeting
- Lead with actionable items, not background
- If the person has overdue items FROM them (they owe us something), highlight it
- If WE have overdue items for them, flag it as "We need to address this"
- Never include sensitive financial details in the brief (those stay in vault)

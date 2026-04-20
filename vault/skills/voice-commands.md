---
name: voice-commands
description: Two-way voice command processing — parse spoken commands and execute actions
version: 1.0
---

## Purpose
When T.J. speaks a command via voice (Groq Whisper STT transcribes it), this skill
interprets the intent and executes the corresponding action. Enables hands-free
control of Chief.

## Command Patterns

### Status Queries
- "What's on my schedule/today/grind" → Read today's grind queue and summarize
- "How's the gateway/system/Chief doing" → Fetch health endpoint and summarize
- "What are the deadlines" → Check Basecamp for upcoming due dates within 7 days
- "What's the budget/spend" → Read shadow cost daily summary
- "How's [project name] going" → Read project status from vault

### Task Actions
- "Mark [task] as done" → Run basecamp-sync to complete the matching task
- "Add [task] to [project]" → Create new Basecamp todo via sync script
- "Move [task] to [day]" → Update Grind queue for specified day
- "Skip [task]" → Mark task as skipped in today's Grind results

### Briefing Requests
- "Brief me on [person]" → Trigger pre-meeting-brief skill
- "Give me the morning brief" → Read the cached morning brief
- "What happened today/yesterday" → Summarize Grind results + Basecamp activity

### Planning
- "What's blocked" → Check Basecamp for blocked items across all projects
- "What's next" → Read ACTIVE.md action items sorted by priority
- "Remind me about [thing]" → Add to tomorrow's Grind queue

## Execution Rules
- Always confirm destructive actions before executing: "I'll mark 'Call Ali' as done. Confirm?"
- For ambiguous matches, ask: "Did you mean [option A] or [option B]?"
- Keep voice responses under 30 seconds of speech (~100 words)
- Use Edge TTS (en-US-GuyNeural) for responses
- Log all voice commands to ~/.hermes/logs/voice-commands.log

## Integration
- STT: Groq Whisper (whisper-large-v3-turbo) — already configured in config.yaml
- TTS: Edge TTS (en-US-GuyNeural) — already configured
- This skill is triggered when voice input is detected via the CLI `ctrl+b` shortcut
  or when a voice message arrives via Telegram
- Voice messages in Telegram are auto-transcribed by Hermes v0.7.0+

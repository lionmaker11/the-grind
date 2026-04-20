# Claude Code Session Mining Report
**Date:** March 24, 2026 | **Sessions Scanned:** 13 (120K primary + 12 short)

---

## Executive Summary
Extracted 13 Claude Code sessions from mining script. One substantial session (March 19, 115 messages) containing critical architecture decisions, security fixes, and project status. 12 recent sessions are MARCUS Orchestrator runs with auth failures (expected).

**Key Findings:**
1. **OpenClaw TTS Configuration** — Architecture lesson on hot-reload limitations
2. **Security Improvements** — Command injection and parameter injection fixes applied
3. **Trello ↔ Calendar Sync** — Built and verified idempotent sync mechanism
4. **Project Template System** — Comprehensive .claude/ folder configuration pattern for all future projects
5. **AI Infrastructure Analysis** — 13 screenshots analyzed from X/Twitter, 10 discoveries mapped to Lionmaker projects

---

## Architecture Decisions

### 1. OpenClaw Gateway: TTS Configuration Not Hot-Reloadable
**Problem:** `messages.tts.auto: "always"` was causing every Chief reply to Telegram to generate Edge TTS audio, which Telegram auto-transcribes, producing unwanted transcription attachments.

**Initial Fix Attempt:** Changed config to `messages.tts.auto: "off"` and expected hot-reload.

**Discovery:** Config changes were detected but **not applied** — only model parameters hot-reload. TTS configuration changes require a **full gateway restart**.

**Lesson:** Document in OpenClaw that `messages.tts` config is NOT hot-reloadable. Full gateway restart required for TTS changes.

**Solution Applied:** Full gateway restart applied. Issue resolved.

**Web UI Unaffected:** Voice chat UI uses independent ElevenLabs TTS (calls API directly), completely separate from OpenClaw's `messages.tts` config. 6 direct ElevenLabs references confirmed in voice-server.js.

---

### 2. Trello ↔ Calendar Auto-Sync Architecture
**File:** `~/.openclaw/chief-sync.js`

**Pattern:** 
- Runs every 30 minutes via LaunchAgent
- Parses time windows from card names: `(09:00–10:00)` syntax
- Creates Google Calendar events via `gog` CLI for cards in day-of-week columns
- Stores `cal_event_id:` in card descriptions for reverse lookup/cleanup
- Idempotent — second run created 0 duplicates (verified)
- Skips header cards and Backlog (protected cards)
- Cleanup: moves events to trash when cards move to Done

**Lessons Learned:**
- Query Trello in parallel (cards + lists) to avoid N+1 calls
- Store reverse-lookup IDs (cal_event_id) to track which calendar events belong to which cards
- Use `gog calendar add` with explicit timezone (America/Detroit) to avoid UTC confusion
- Test idempotency with multiple runs

---

### 3. .claude/ Folder Configuration System
**Context:** Analyzed 13 emerging AI infrastructure patterns from X/Twitter (March 22, 2026 screenshots).

**Architecture Pattern Discovered:**
Modern Claude Code projects use a `.claude/` folder control plane:
```
project-root/
├─ .claude/
│  ├─ CLAUDE.md              # Team instructions (committed)
│  ├─ CLAUDE.local.md        # Personal overrides (gitignored)
│  ├─ settings.json
│  ├─ commands/              # Custom slash commands
│  │  ├─ /project:status
│  │  ├─ /project:deploy
│  │  ├─ /project:review
│  │  └─ ...
│  ├─ rules/                 # Modular rule files (auto-invoked)
│  │  ├─ code-style.md
│  │  ├─ security.md
│  │  ├─ testing.md
│  │  └─ ...
│  ├─ skills/                # Auto-invoked skill registry
│  │  ├─ debugging/SKILL.md
│  │  ├─ deployment/SKILL.md
│  │  └─ ...
│  └─ agents/                # Isolated subagent personas
│     ├─ architect.md
│     ├─ reviewer.md
│     └─ ...
```

**Application to Lionmaker:** This pattern should be implemented for:
- **Chief** (AI PM for Lionmaker)
- **MARCUS** (AI Agent System)
- **MCD Command Center** (Command & Control)

**Recommendation:** Build master project template with this structure for all future Lionmaker projects. Commands should include:
- `/chief:status` — unified status across all managed projects
- `/chief:new-project` — scaffold from master template
- `/project:office-hours` — planning phase
- `/project:deploy` — automated deployment with security gates
- `/project:review` — code review with checklist enforcement

---

## Security Fixes Applied

### 1. Command Injection Vulnerability in media-attach.js (Line 115)
**Issue:** `filePath` interpolated directly into shell command string via `execSync`.
```javascript
// BEFORE (vulnerable)
execSync(`ffprobe -v quiet -print_format json -show_format "${filePath}"`)
```

**Fix:** Use `execFileSync` with array arguments to prevent injection.
```javascript
// AFTER (safe)
execFileSync('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath])
```

**Impact:** Critical — arbitrary code execution possible with malicious filenames.

---

### 2. Special Character Injection in chief-sync.js (Line 143)
**Issue:** Card description content embedded in URL query parameter, breaks with special characters like `&`, `=`, `#`.
```javascript
// BEFORE (fragile)
const url = `https://api.trello.com/1/cards/${id}?desc=${desc}`
```

**Fix:** Move to JSON request body with proper Content-Type header.
```javascript
// AFTER (safe)
const body = { desc }
// Trello request utility properly JSON-encodes body
```

**Impact:** High — card descriptions with special characters could corrupt API calls or leak to logs.

---

## Project Status Updates

### Chief (OpenClaw PM System)
**Last Updated:** March 19 (config restart)
**Status:** Operational
**Issues Resolved:**
- ✅ TTS transcription attachments (fixed via gateway restart)
- ✅ Trello ↔ Calendar auto-sync (built and verified)
- ✅ Media attachment service (removed — was solving wrong problem)
- ✅ Two security vulnerabilities (command injection, parameter injection)

**Open Items (from session notes):**
- ❓ Gateway `sessions.resolve` errors for main and @rocha11_bot at heartbeat checks (Thu/today) — investigation needed
- ⏳ MARCUS daily check-ins — status unknown
- ⏳ Alex OpenClaw WhatsApp pairing — unresolved
- ⏳ Pallister countertops escalation — overdue

---

### MARCUS (Trading System)
**Status:** Orchestrator pattern running (auth loop in recent sessions)
**Sessions:** 6+ recent Orchestrator runs attempted (all hit auth wall — expected)
**Pattern:** Daily scrum, inbox processing, task board management, backup jobs
**Next Focus:** Fix Orchestrator auth, enable task board operations

---

## New People/Collaborators Mentioned
None explicitly named in mining data.

---

## Lessons Learned / Patterns to Document

### 1. Hot-Reload Limitations in Gateway Config
**Discovery:** Not all OpenClaw config changes are hot-reloadable.
- ✅ `agents.defaults.models` — hot-reloadable
- ✅ `agents.defaults.thinking` — hot-reloadable  
- ❌ `messages.tts.*` — NOT hot-reloadable (requires full restart)
- **Action:** Audit all config settings, document which require restart

### 2. Idempotent Sync Patterns
**Pattern:** When building LaunchAgent-triggered sync jobs, always implement idempotency checks.
- Store reverse-lookup IDs (e.g., `cal_event_id:` in descriptions)
- Query existing state before creating duplicates
- Test with multiple consecutive runs
- **Example:** Trello ↔ Calendar sync verified 0 duplicates on second run

### 3. Avoid Solving the Wrong Problem
**Lesson:** Misunderstood "media auto-attach" issue → spent time building wrong service.
- Always clarify problem statement before building
- If solution doesn't work after implementation, re-question the problem definition
- **Result:** Wasted effort on media-attach.js service; removed after clarification

### 4. Test from User's Perspective (Rule One)
**Discovery:** API status codes ≠ actual output quality. Must verify visually.
- Trello cover images appear 250px wide on mobile
- ImageMagick emoji rendering unreliable
- Redundant text in cover images wastes space
- **Apply:** Always take screenshot of output before marking done

---

## Recommendations for Vault Update

1. **Add to SHARED_CONTEXT.md:**
   - OpenClaw TTS config hot-reload limitation
   - .claude/ folder configuration pattern (new standard for all projects)
   - Idempotent sync implementation pattern
   - Command injection prevention (execFileSync vs execSync)

2. **Create new document:** `security-discoveries-2026-03.md`
   - Command injection vulnerability (media-attach.js)
   - Parameter injection vulnerability (chief-sync.js)
   - Security review checklist for future services

3. **Log to project files:**
   - Chief project: Mark TTS issue as resolved, document config restart requirement
   - MARCUS: Document Orchestrator pattern and auth requirements
   - Lionmaker: Build master project template with .claude/ structure

4. **Create template reference:** `project-templates/master/.claude/` structure and commands

---

## Session Details
- **Primary Session:** claude-conversation-2026-03-19-21a71d6f.md (115 messages, 120K)
- **Duration:** March 19 spanning multiple hours
- **Focus:** Chief system improvements, TTS fix, security hardening
- **Secondary Sessions:** 12× MARCUS Orchestrator runs (2 messages each, auth failures)

**Mining Status:** ✅ Complete — all actionable insights extracted

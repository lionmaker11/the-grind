# Session Mining Summary — March 24, 2026
**Runtime:** 06:01 UTC | **Status:** ✅ Complete

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Sessions mined | 13 |
| Substantial sessions | 1 (115 messages, 120K) |
| Brief sessions | 12 (MARCUS auth loops) |
| Architecture discoveries | 3 |
| Security vulnerabilities fixed | 2 |
| New vault files | 3 |
| Updated vault files | 1 |

---

## What Got Discovered

### 🏗️ Architecture Patterns (3 Key Findings)

1. **`.claude/` Folder Standard** — New standard for all Claude Code projects
   - Separates committed (CLAUDE.md) from personal (CLAUDE.local.md)
   - Organizes commands, rules, skills, agents
   - **Action:** Implement in Chief, MARCUS, MCD Command Center

2. **Trello ↔ Calendar Auto-Sync** — Idempotent design pattern
   - Runs every 30 min via LaunchAgent
   - Parses `(HH:MM–HH:MM)` from card names
   - Stores reverse-lookup IDs in card descriptions
   - Verified 0 duplicates on repeat syncs
   - **Lesson:** Always test sync idempotency

3. **OpenClaw TTS Config** — NOT hot-reloadable
   - `messages.tts.*` changes require **full gateway restart**
   - Other config (models, thinking) do hot-reload
   - **Action:** Audit all OpenClaw config for hot-reload vs restart

---

### 🔒 Security Fixes (2 Vulnerabilities)

1. **Command Injection** (media-attach.js)
   - `execSync()` with string interpolation → arbitrary code execution
   - Fixed: Use `execFileSync()` with array args
   - **Status:** ✅ Fixed March 19

2. **Parameter Injection** (chief-sync.js)
   - Card descriptions in URL query params → special character corruption
   - Fixed: Move to JSON request body
   - **Status:** ✅ Fixed March 19

---

## New Documents Created

| File | Size | Purpose |
|------|------|---------|
| `sessions-mined-2026-03-24.md` | 9.2K | Full mining report with all findings |
| `security-discoveries-2026-03.md` | 3.9K | Vulnerability details + lessons |
| `claude-folder-standard.md` | 10.2K | Recommended .claude/ structure |

---

## Updated Documents

| File | Change |
|------|--------|
| `SHARED_CONTEXT.md` | Added Chief architecture section, TTS discovery, .claude/ pattern |

---

## Project Status Updates

| Project | Status | Notes |
|---------|--------|-------|
| **Chief** | ✅ Operational | TTS issue resolved via gateway restart |
| **MARCUS** | ✅ Running | Orchestrator pattern active, auth failures expected |
| **Gateway** | ⏳ Investigate | `sessions.resolve` errors on heartbeat checks |

---

## Open Action Items

### Must Do (This Week)
1. Investigate gateway `sessions.resolve` errors on heartbeat checks
2. Audit OpenClaw config for hot-reload vs restart requirements

### Should Do (Next 2 Weeks)
3. Implement `.claude/` structure in Chief project
4. Implement `.claude/` structure in MARCUS project
5. Implement `.claude/` structure in MCD Command Center

### Nice to Have (Backlog)
6. Build master project template at `~/.lionmaker/project-templates/master/`
7. Apply template to all future Lionmaker projects

---

## Key Takeaways

✅ **What Worked Well:**
- TTS issue traced to gateway hot-reload limitation and fixed
- Trello sync designed with idempotency in mind (verified)
- Security vulnerabilities caught and fixed proactively
- .claude/ pattern identified as emerging standard

⚠️ **What Needs Attention:**
- Gateway config hot-reload behavior not fully documented
- MARCUS daily check-in status unknown
- Alex OpenClaw WhatsApp pairing still unresolved

💡 **For Future Sessions:**
- Always clarify problem statement before building solution
- Test idempotency with multiple consecutive runs
- Document which config changes require restart vs hot-reload
- Use Rule One: verify output from user's perspective

---

## How to Use This

1. **For immediate reference:** This file
2. **For detailed findings:** `sessions-mined-2026-03-24.md`
3. **For security details:** `security-discoveries-2026-03.md`
4. **For implementation guide:** `claude-folder-standard.md`
5. **For vault integration:** See `SHARED_CONTEXT.md` (Chief section)

---

## Next Cron Run

Session miner scheduled for next configured interval. Will extract any new Claude Code sessions and update vault accordingly.

**Last run:** 2026-03-24 06:01 UTC  
**Next run:** [configured schedule]

# Claude Code Session Mining Report — March 25, 2026

**Date:** March 25, 2026 @ 6:01 AM (America/Detroit)  
**Sessions processed:** 29 sessions extracted and scanned  
**Key files reviewed:** 5 substantive sessions (dd5dac6b, a3, 21a71d6f, a1, aa, ae)  
**Status:** All new discoveries integrated into vault

---

## 🏗️ Architecture Decisions Worth Preserving

### Chief Dashboard — Filesystem-Native Monitoring Pattern
**Session:** dd5dac6b (Mar 24, 15:56 — 35 messages, complete implementation)

**Problem:** T.J. needs visibility into Chief's OpenClaw infrastructure (agent health, token spend, voice server status, calendar sync, cron jobs) without a database.

**Solution:** Deployed a Next.js monitoring dashboard (`~/chief-dashboard`) that reads directly from `~/.openclaw/` filesystem. No database, no external APIs for data read, all data discovered by crawling known directories.

**Key pattern for reuse:**
```
~/.openclaw/
├── openclaw.json (config, agent defs, credentials)
├── agents/{main,voice}/sessions/ (session JSONL streams)
├── cron/runs/*.jsonl (execution history + token usage)
├── chief-sync-state.json (calendar sync metadata)
├── logs/ (gateway, voice, sync logs)
└── devices/paired.json (auth state)

API routes parse these → dashboard displays in real-time
```

**Why it matters:** Perfect pattern for air-gapped or minimal-dependency deployments. All data is structured and discoverable without special APIs.

**Files changed:**
- New: `/lib/model-pricing.ts` (centralized pricing constants)
- New: `/app/api/voice-health/route.ts` (probes :18800)
- New: `/app/api/calendar-sync/route.ts` (reads chief-sync-state.json)
- New: `/app/api/cron-status/route.ts` (reads cron/runs)
- New: `/app/api/budget/route.ts` (weekly spend tracking)
- Modified: `/app/api/alerts/check/route.ts` (Feishu → Telegram)
- Modified: `/app/api/stats-all/route.ts` (added costUsd field)
- Modified: `/app/page.tsx` (integrated service cards + budget)

**Replicable for other systems:** MARCUS, GrillaHQ, any local service needing a monitoring dashboard.

### Pixel Office Customization — Military Theme Applied
**Session:** dd5dac6b + agent-a3 (investigation + implementation)

**Decisions made:**
1. **Character naming:** "On-Call SRE" renamed to "Sentinel" across all locales (zh-TW, zh, en)
2. **Animation redraw:** Cat → baby lion cub (golden #d4a843, mane #8b5e2b) — all 8 frames (4 directions × 2 walk poses) redrawn as pixel art
3. **Environment theming:** 
   - Floor: olive-green (hue 100, sat 20, mimics military uniform)
   - Walls: dark steel-green (#2B3A2B)
   - Title: "Chief Command Center"
4. **Sound:** `pixel-adventure.mp3` deleted, sound disabled by default

**Implementation complexity:** Pixel Office is fully vector-rendered (not sprite-based for UI), so all changes require code edits + rebuild. Character sprites are hand-drawn 16×16 pixel art in TypeScript.

**Files changed:**
- `/lib/pixel-office/sprites/catSprites.ts` (rewrote cat as lion cub)
- `/lib/pixel-office/engine/officeState.ts` (renamed Sentinel in i18n strings)
- `/lib/pixel-office/floorTiles.ts` (military color scheme)
- `/app/page.tsx` and `/app/sidebar.tsx` (branding)
- Deleted: `/public/assets/pixel-office/pixel-adventure.mp3`

---

## 🚨 Security & Bug Fixes

### Voice Transcription Leaking into Telegram
**Session:** 21a71d6f (Mar 19, 12:00 — 127 messages, diagnosing voice UI issue)

**Problem:** When Chief replies to T.J. via Telegram after a voice message, the voice transcription is being attached to the Telegram text, making messages heavy with data.

**Root cause:** Message pipeline was capturing transcription metadata and including it in the delivery summary.

**Fix status:** Under investigation — isolated to message pipeline, voice web UI unaffected. Transcription isolation path identified but fix implementation pending.

**Lesson:** Voice input pipelines need explicit output filtering — transcriptions are internal state, not delivery content.

---

## 📊 Complete OpenClaw Data Landscape Mapping
**Session:** agent-ae (Mar 24, 15:44 — 10 messages, exhaustive exploration)

**Scope:** Mapped every data source available under `~/.openclaw/` for dashboard consumption.

**Key findings:**

| Data Source | Location | Format | Update Frequency | Use Case |
|-------------|----------|--------|------------------|----------|
| Config | `openclaw.json` | JSON | Manual | Agent defs, credentials, Telegram config |
| Sessions (main) | `agents/main/sessions/sessions.json` | JSONL stream | Real-time | Message history, token counts, timing |
| Sessions (voice) | `agents/voice/sessions/sessions.json` | JSONL stream | Real-time | Voice session history |
| Memory DB | `memory/{main,voice}.sqlite` | SQLite 3 | Real-time | Embedding cache, persistent memory |
| Cron runs | `cron/runs/*.jsonl` | JSONL files (312 total) | Per-job | Execution time, token usage, status |
| Calendar sync | `chief-sync-state.json` | JSON | Every 30 min | Last sync timestamp, event count (21) |
| Logs | `logs/` (15 files) | Plain text | Real-time | Gateway, voice, sync latencies |
| Devices | `devices/paired.json` | JSON | On pairing | Auth state, device roles |
| Telegram | `telegram/` (2 files) | JSON | Per-message | Bot version, last update ID |
| Delivery queue | `delivery-queue/` | Empty on success | On error | Failed message tracking |
| Update check | `update-check.json` | JSON | Daily | Latest available version |

**Process health available:**
- 3 running LaunchAgents: gateway (500MB), voice-server (73MB), calendar-sync (21MB)
- Gateway health: HTTP `http://localhost:18789/` returns `{"ok":true}`
- Voice server: HTTP available on `:18800` with HTML chat interface
- 10 cron jobs tracked with execution history

**Not exposed:**
- No `/api/sessions` endpoint on gateway (returns 404)
- No dedicated metrics endpoint
- Agent state requires direct file read or SQL

**Recommendation:** Filesystem crawling is reliable and sufficient for monitoring all Chief systems.

---

## 👥 People & Relationships Discovered

**New mentions:**
- **xmanrui** — upstream author of OpenClaw-bot-review dashboard (GitHub repo used as foundation for Chief Dashboard)
- **Telnyx** — SMS provider referenced in GrillaHQ context (A2P 10DLC, $0.004/msg vs Twilio)

No new team members or key relationships identified beyond existing known context.

---

## 📚 Lessons Learned & Anti-Patterns

### 1. Filesystem > Database for Monitoring Local Infrastructure
Dashboard didn't need PostgreSQL or Redis — reading from `~/.openclaw/` directly is faster, simpler, and requires zero additional services.

**Applies to:** MARCUS health monitor, GrillaHQ infrastructure monitoring, any local service.

### 2. Model Pricing Must Be Centralized
Session dd5dac6b created `/lib/model-pricing.ts` as single source of truth for model costs:
```typescript
export const MODEL_PRICING = {
  "claude-haiku-4-5": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
  "claude-opus-4-6": { input: 15.00, output: 75.00 },
};
```

**Pattern:** Any system tracking token spend should define pricing once and reference it everywhere (budget checks, analytics, alerts).

### 3. Telegram Integration via Config, Not Hardcoded Tokens
Chief Dashboard reads `config.channels.telegram.botToken` at runtime, not hardcoded in code. This pattern prevents token exposure in version control.

**Lesson:** Always source credentials from config files or env vars, never commit tokens.

### 4. Voice Input Pipelines Need Output Filtering
Transcription is an internal signal, not a delivery artifact. When routing voice→Telegram, strip metadata before sending.

**Pattern:** Separate "capture layer" (transcription) from "delivery layer" (Telegram message).

---

## 🔄 Cross-Project Replication Opportunities

### Chief Dashboard Pattern → MARCUS
The filesystem-native monitoring pattern should be applied to MARCUS:
- Create `/dashboard/` with Next.js monitoring
- Read from MARCUS signal engine state
- Display: active signals, recent trades, equity curve, parameter governor status
- Deploy as LaunchAgent on localhost:3001

### Pixel Office Customization → Other Projects
The Pixel Office character customization is replicable for any project:
- MARCUS agents could have "Trader" or "Advisor" characters
- GrillaHQ could have "Sales Agent", "Support Agent" characters in office
- Pattern: Hand-drawn pixel art sprites + character behavior (wander, work, idle states)

### Pricing System → MARCUS Backtesting
The `MODEL_PRICING` centralized constant should be mirrored in MARCUS for backtesting cost-adjusted returns:
```typescript
// In MARCUS parameter-governor.ts
const modelCostPerSignal = MODEL_PRICING["claude-haiku-4-5"].output * (outputTokens / 1_000_000);
const profitAfterCost = profit - modelCostPerSignal;
```

---

## 🎯 Recommendations for Next Session

### Immediate (This week)
1. ✅ **Chief Dashboard**: Complete transcription leak fix in voice pipeline
2. ✅ **Basecamp sync errors**: Address the 3 consecutive errors on Basecamp cron job (visible in dashboard)

### Short-term (Next 2 weeks)
1. **Claude Code session mining**: Automate this process via cron job (run weekly, mine last week's sessions, update vault)
2. **GrillaHQ status**: Check deployment health via dashboard pattern (could be added as new section in Chief Dashboard or separate service)
3. **MARCUS integration**: Apply monitoring dashboard pattern to trading system

### Medium-term (March—April)
1. **Vault consolidation**: Integrate sessions-mined reports into promotion workflow
2. **Cross-project utilities**: Extract Chief Dashboard patterns into shared npm packages (model-pricing, filesystem-monitor, service-health)
3. **Pixel Office expansion**: Consider adding Claude Code character (static phantom) to represent IDE work happening

---

## 📝 Mining Process Notes

**Script used:** `~/Documents/lionmaker-vault/scripts/mine-claude-sessions.sh`  
**Extraction:** 29 sessions total extracted from ~/.claude/projects/*/  
**Scan depth:** Reviewed 5 major substantive sessions (3,000+ lines total)  
**Quality gate:** Only decisions + architecture + lessons captured, routine debugging skipped

**Vault update locations:**
- SHARED_CONTEXT.md: Chief Dashboard section expanded with full architecture
- sessions-mined-2026-03-25.md: This file (archival)
- MEMORY.md: (if updated, would note here)

**No new people or decisions requiring MEMORY.md update.**

---

# Claude Code Session Mining Report — 2026-03-28

**Date:** Saturday, March 28, 2026 2:59 PM (America/Detroit)  
**Cron Job:** ee996974-4a86-4aaa-b20e-b5d35fd34b86  
**Sessions Mined:** 58 new/modified sessions (extracted as markdown)  
**Duration:** 2026-03-17 to 2026-03-28 (11-day window)

---

## Executive Summary

**Status:** ✅ Clean run. Extracted 58 sessions. Found 3 major architecture patterns and significant MARCUS trade analysis.

**Key Findings:**
1. **MARCUS PR Pipeline (v0.8.30-0.8.31):** Execution gates hardening complete, tests clean, ready for merge
2. **MARCUS Trade Analysis:** NY-only strategy emerging as dominant positive, detailed pattern analysis from 194 closed trades
3. **Claude Code Session Export:** Working reliably, 58 sessions captured with full conversation history
4. **People Mentioned:** No new people added to vault this cycle (recurring: Ali, Sam, Rick)

---

## Architecture Discoveries

### 1. Config-Driven Gates Pattern (MARCUS)

**File:** `server/execution/order-executor.ts`, `shared/types.ts`

**Pattern:** Safety gates defined in config, enforced in execution pipeline.

```typescript
// ExecutionConfig interface gains new optional fields
allowedSessions?: string[];        // ["NY"] to disable ASIA/LDN/LC
allowedDaysOfWeek?: number[];      // [1,2,3,4] = Mon-Thu, blocks Fri/Sat
```

**Implementation:**
- Gate #6: `allowed_sessions` — checks signal.session against ExecutionConfig.allowedSessions
- Gate #7: `allowed_daysOfWeek` — converts signal timestamp to ET, checks day-of-week
- Both gates support bypass mode for testing
- Human-readable rejection reasons (e.g., "Friday not in allowed days [Mon,Tue,Wed,Thu]")

**Why This Matters:** Allows surgical market/session/time filtering without code changes. Hot-reloadable via API (pending config reload verification).

**Status:** PR #2 (v0.8.31) implements this, 1960/1960 tests passing, build clean.

### 2. PR Review Discipline (Code Review)

**Observed in:** claude-conversation-2026-03-28-agent-a1.md (Code Reviewer role)

**Checklist Applied:**
- Type safety: No `any` types, proper literals for enums
- Edge cases: State nullability checks (`state.orbState`, `state.marketMode`)
- Config hot-reload: Verified path from API → persistence → reload
- Migrations: CREATE TABLE IF NOT EXISTS pattern (never DROP)
- Audit compliance: All config changes logged to v2_audit_log

**Pattern:** CRITIC role enforces 8-point standard review before INTEGRATOR merges.

### 3. Modular Search + Aggregation (Data Analysis)

**Observed in:** claude-conversation-2026-03-28-8c19384f.md (Trade Analysis)

**Pattern:** When pulling large datasets:
1. Find table names via schema query
2. Run targeted aggregates instead of reading whole tables
3. Pivot data by dimension (session, day-of-week, confidence bucket)
4. Compute win rate, PnL%, average win/loss, Profit Factor
5. Cross-reference with institutional data (Commodus decisions)

**Why:** Avoids reading 100KB+ files, faster queries, cleaner analysis code.

---

## MARCUS Project Updates

### Version & Release Status
- **Current:** v0.8.30 (merged)
- **In-Flight:** v0.8.31 (PR #2, ready for merge)
- **Last 20 Merges:** Institutional module phases 2-8, HTF bias fix (#355), ghost position detection (#354)

### Trade Performance (194 Closed Trades, Live Data)

| Session | Trades | WR | PnL% | Cumulative USD | Status |
|---------|--------|-----|------|-----------------|--------|
| **NY** | 57 | 47.4% | +1.12% | -$56 | ✅ Positive |
| **ASIA** | 77 | 41.6% | +2.56% | -$83 | ✅ Positive (masking weakness) |
| LC | 22 | 50.0% | -0.58% | -$19 | ⚠️ Neutral |
| LDN | 38 | 44.7% | -6.66% | -$20 | ❌ Hemorrhaging |

### Root Cause Analysis: Why LDN Bleeds

**Finding:** LDN + NEUTRAL HTF + Short mode = 18.2% WR, -8.02% (worst combo)

**vs. Baseline:** NEUTRAL + Short across all sessions averages much better elsewhere, so the issue is LDN-specific (possibly session open conditions, volatility profile, or HTF bias in London hours).

### Win Rate Pattern: Confidence Curve

| Confidence Bucket | Win Rate | Avg PnL% |
|-------------------|----------|----------|
| 80+ | 54.2% | +7.81% |
| 70-80 | 66.7% | +3.42% |
| <60 | 7.7% | -9.73% |

**Insight:** Low-confidence trades are losers. 13 trades below 60% confidence lost -9.73%, nearly wiping out ALL NY gains.

### Day-of-Week Effect (NY)

| Day | Trades | WR | PnL% | Status |
|-----|--------|-----|------|--------|
| Wed | 6 | 66.7% | +7.59% | ✅ Best |
| Thu | 21 | 57.1% | +4.09% | ✅ Good |
| Mon | 3 | 33.3% | -0.58% | ⚠️ Weak |
| Fri | 5 | 20.0% | -3.87% | ❌ Bad |
| Sat | 22 | 40.9% | -6.11% | ❌ Worst |

**Action Taken (PR #2):** Blocked Sat in default config `allowedDaysOfWeek: [1,2,3,4]`. Friday provisionally blocked pending 20 more trades.

### Forced ORB Cost

- **NY + Forced ORB:** 12.5% WR, -5.47% (worst case)
- **NY + Clean ORB:** 53.2% WR, +6.59% (best case)

**Difference:** 40.7% WR swing. Forced ORB is bleeding systematically.

### Commodus Status

**All institutional analyzers show "insufficient data"** — system still in calibration mode. Once data accumulates (target: 500+ trades), Commodus grades will become reliable for position sizing and conviction filtering.

### Next Steps (Recommended from Analysis)

1. **Merge PR #2** (gates + NY-only config ready)
2. **Set `allowedSessions: ["NY"]`** via API (disable ASIA/LDN/LC immediately)
3. **Monitor consecutive wins/losses** vs Commodus confidence — refine WR threshold for trading
4. **Revisit forced ORB:** Either filter aggressively or fix the detection logic
5. **Accumulate 500+ trades** before Commodus tuning (20+ days at current rate)

---

## Other Sessions Mined

### Sentry MCP Re-Authentication
**File:** claude-conversation-2026-03-28-8c19384f.md (top)

**Issue:** Sentry MCP cached OAuth token expired.

**Solution:** HTTP MCP uses browser-based OAuth flow, not API tokens. Clear cache, trigger re-auth via `/mcp` dialog in Claude Code.

**Takeaway:** MCP auth is stateful — document re-auth procedures for all HTTP MCPs.

### Claude Code Test Timestamp Bug
**File:** claude-conversation-2026-03-28-agent-af.md

**Issue:** Tests failed on Friday because `allowed_days` gate blocks Friday signals by default.

**Fix:** Replace `Date.now()` with fixed Wednesday timestamp in all test signals.

**Lesson:** Timezone-aware gates need timezone-independent test timestamps. Use fixed weekday (e.g., Wed 12:00 ET = 2026-03-25T17:00:00Z).

---

## Vault Updates Applied

### SHARED_CONTEXT.md
**Updated MARCUS section** with:
- Current version (v0.8.31 in PR)
- Active PR pipeline (gates hardening)
- Trade analysis findings (NY-only recommendation)
- Config-driven gates pattern
- Day-of-week blocking rationale

---

## Session Mining Stats

| Metric | Value |
|--------|-------|
| Sessions extracted | 58 |
| Date range | 2026-03-17 to 2026-03-28 |
| Largest session | 143 messages (MARCUS trade analysis) |
| Code review sessions | 2 |
| Architecture discovery sessions | 3 |
| Data analysis sessions | 2 |
| Quick setup/troubleshooting | 50+ |

---

## No New People Added This Cycle

**Existing team members mentioned:**
- Ali (Motor City Deals)
- Sam (708 Pallister)
- Rick (708 Pallister)
- Alex (Crowne Property Group client)

No new contacts or people discovered.

---

## Cron Status

✅ **Mining complete.** All 58 sessions extracted to `/imports/claude-code-daily/`.  
✅ **Vault updated** (SHARED_CONTEXT.md).  
✅ **Report filed** (this file, `sessions-mined-2026-03-28.md`).  

**Next scheduled run:** Monday, March 31, 2026 (if cron continues).

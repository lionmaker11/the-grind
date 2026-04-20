# MARCUS ↔ Obsidian Two-Way Sync Integration

## Objective
Create a bidirectional sync system that keeps MARCUS trading data, signals, and performance metrics in sync with the Obsidian vault in real-time.

## What Needs to Sync

### MARCUS → Obsidian (Pull)
- Daily trading summary (date, P&L, win rate, trades executed)
- Signal intelligence (which indicators fired, confidence scores)
- Error logs and edge case detections
- Strategy performance by timeframe/asset
- Historical trades with entry/exit reasoning
- Hyperlinks: trading logs → MARCUS app, signals → Railway dashboard

### Obsidian → MARCUS (Write)
- Strategy tweaks and parameter adjustments
- New signal rules or indicator modifications
- Risk limits or position size changes
- Comments/observations on specific trades for future reference

## Technical Requirements

### Data Sources
- MARCUS app backend (Railway) — API endpoints for trades, signals, performance
- Obsidian vault — ~/Documents/lionmaker-vault/projects/marcus/

### Sync Pattern
- **Pull frequency:** Every 15 minutes (check for new trades/signals)
- **Write frequency:** On-demand + batch hourly
- **Conflict resolution:** Obsidian edits take priority (user edits the source of truth)
- **Storage:** `projects/marcus/trading-logs/YYYY-MM-DD.md` + `marcus-dashboard.md` (aggregated)

### File Structure (Target)
```
projects/marcus/
├── marcus-dashboard.md (current P&L, today's summary, latest signals)
├── marcus-config.md (strategy parameters, risk limits, signal rules)
├── trading-logs/
│   ├── 2026-03-24.md (today's trades, entry/exit reasons, P&L)
│   ├── 2026-03-23.md
│   └── [archive by date]
└── performance-analysis.md (weekly/monthly stats, win rates, patterns)
```

### API Integration
- Fetch endpoint: GET /api/v1/trades?startDate=X&endDate=Y (returns JSON trades array)
- Fetch endpoint: GET /api/v1/signals?limit=50 (recent signals)
- Fetch endpoint: GET /api/v1/performance/summary (daily P&L, win rate, etc.)
- Write endpoint: POST /api/v1/strategy-updates (send config changes from Obsidian)

### Implementation Approach
1. Create Node.js worker: `tasks/marcus-obsidian-sync.js`
2. Runs every 15 min via cron (or manual trigger from Chief)
3. Pulls latest trades/signals from Railway API
4. Formats into Markdown with timestamps, hyperlinks, metadata
5. Checks Obsidian config file for strategy tweaks
6. Posts any updates back to MARCUS API
7. Logs all syncs to `marcus-vault-sync.log`

### Edge Cases to Handle
- Network timeout: graceful retry with exponential backoff
- Duplicate trades: deduplicate by trade ID before writing
- Timezone handling: ensure all times in America/Detroit (ET)
- Large trade history: archive trades >30 days old to separate files
- API rate limits: batch requests, respect 429 Retry-After headers
- Obsidian offline: queue changes, sync when back online

### Definition of Done
✅ New trades appear in Obsidian within 15 min of execution
✅ Signal intelligence synced with confidence scores and entry reasoning
✅ Daily summary (P&L, win rate, trades) auto-populated in marcus-dashboard.md
✅ Strategy parameter changes in Obsidian can be posted back to MARCUS API
✅ No duplicate trades or lost data in sync
✅ Hyperlinks from Obsidian to MARCUS app work correctly
✅ Sync logs auditable for debugging

### Notes for Claude Code
- T.J. checks MARCUS 2x daily (morning 15 min + weekly 30 min deep session)
- Obsidian vault is his source of truth for strategy decisions
- This sync reduces manual data entry and keeps both systems in sync
- Priority: reliability over speed (no false positives, no data loss)

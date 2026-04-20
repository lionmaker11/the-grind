---
project: marcus
type: access
last_updated: 2026-04-13
tags: [marcus, infrastructure, access]
---

# MARCUS — Chief's Access Methods

Chief's taps into MARCUS for live monitoring. Use these before pinging T.J.

## Railway Project
- **Project:** `scintillating-eagerness` (id: looked up via `railway list`)
- **Auth:** Railway CLI logged in as `thomas@dominantapproach.com`
- **Workspace dir:** `/tmp/rw_scin` (or `railway link --project scintillating-eagerness --environment production`)

### Services
| Service | Role |
|---|---|
| `marcus-v2-production` | Main app (Node/Express + Pine logic + Hyperliquid SDK) |
| `marcus-execution-layer` | Execution & trade-sync worker |
| `marcus-monitor` | Health monitor |
| `marcus-task-board` | Task board UI |
| `marcus-v2-staging` | Staging env |
| `Postgres` (x2) | Prod + staging DBs |

## Commands

```bash
cd /tmp/rw_scin

# Tail main app logs
railway logs --service marcus-v2-production | tail -100

# Tail execution layer (has Hyperliquid ping / trade-sync)
railway logs --service marcus-execution-layer | tail -100

# Filter for trade activity
railway logs --service marcus-v2-production 2>&1 | grep -iE "trade|fill|order|position|signal|entry|exit"

# Watch health pulses
railway logs --service marcus-execution-layer 2>&1 | grep -i "health pulse"
```

## Internal HTTP API (better signal than logs)
The app exposes an HMAC-authenticated API at `marcus-v2-production`:
- `GET /api/v2/trades` → recent trades
- `GET /api/v2/positions` → open positions
- `GET /api/v2/shadow/feed` → shadow event feed
- `GET /api/trade-sync/export` (execution layer, 401-gated)

**TODO:** Get HMAC key/secret from T.J. so Chief can call these directly instead of scraping logs. Much cleaner.

## Known Issues Observed (Apr 13, 2026)
- `trade-sync` worker polling `/api/trade-sync/export` getting **401 Unauthorized every minute** — stale credential, needs fix.
- Earlier health pulse at 8:41 AM: **CRITICAL — exchange_ping=critical, position_match=warn** (Hyperliquid API returning 502/504 through CloudFront).
- Latest trade visible in API: `M-AAGH` — ETH long, LDN session, entry $2188.99, timestamp `1773914220000` = **Mar 19, 2026 17:17 UTC**. That's the MOST RECENT trade as of now.

## Chief's Monitoring Duty
Per USER memory: MARCUS has "NOTHING to do" — it's running and gathering data. Chief's ONLY job is to **monitor if it's trading and alert T.J. if it stops.** Use this file + Railway logs to check at least daily during the morning brief.

**Alert T.J. when:**
- No new trades in 7+ days
- Health pulse = CRITICAL for 2+ consecutive checks
- Trade-sync or exchange_ping failures persist for 24h+
- Execution layer crashlooping / deploy failing

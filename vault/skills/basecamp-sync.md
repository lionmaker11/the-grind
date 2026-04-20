---
name: basecamp-sync
description: Sync task completions between Telegram, TheGrind, and Basecamp with circuit breaker protection
version: 2.0
---

## Purpose
Unified sync layer that keeps TheGrind, Basecamp, and the vault in perfect sync.
Handles both directions: Grind→Basecamp and Basecamp→Grind.

## Modes

### Single Task Sync (Telegram trigger)
When T.J. reports a task done via Telegram:
```bash
python3 ~/.hermes/scripts/telegram_basecamp_sync.py --task "task description"
```

### Grind Evening Sync (9 PM cron)
```bash
python3 ~/.hermes/scripts/grind_basecamp_sync.py
```

### Bidirectional Sync (every 4 hours)
```bash
python3 ~/.hermes/scripts/basecamp_to_grind_sync.py
```

### Full Health Check (every 4 hours)
```bash
python3 ~/.hermes/scripts/basecamp_sync_cron.py
```

## Circuit Breaker Integration
All sync scripts import from `~/.hermes/scripts/circuit_breaker.py`:
- If Basecamp is unreachable, the circuit opens after 5 failures
- Pending syncs are queued to `~/.hermes/sync/pending-queue.json`
- When the circuit closes (after 10-min recovery), the queue is drained
- Circuit status is visible at `http://127.0.0.1:18790/health`

## Data Flow
```
TheGrind (GitHub) ←→ Basecamp ←→ Vault ←→ Dashboard
         ↓                ↓          ↓          ↓
   results/JSON    todos/complete  status.md  /api/grind
```

## Rules
- High-confidence matches (>85% similarity): auto-sync
- Medium matches (60-85%): log for review, include in evening summary
- Low matches (<60%): skip, do not sync
- Never delete or modify Basecamp todos — only mark complete
- Always log sync actions to ~/.hermes/logs/basecamp-sync.log

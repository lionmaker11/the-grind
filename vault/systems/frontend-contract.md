# Frontend Contract — TheGrind

Version: 1.0 | 2026-04-21

---

## Philosophy

Muse is intake-only. No briefs. The app opens to the top 3 pending tasks per active project (from `GET /api/backlog`). The user voice-dumps or types to Muse; she files items to backlogs. Every task carries a priority of 1-5. Biweekly priority review runs on Sunday and Thursday, initiated by Muse.

---

## Required Surfaces

### Project Board

- Displays top 3 pending tasks per active project, sorted by priority ascending (1 = highest).
- Each task row has one "run pomodoro" affordance.

### Muse Chat

- Accepts text and voice input.
- Voice flow: record audio → `POST /api/transcribe` → use returned `text` as the message body → `POST /api/chief`.
- After every Muse turn, call `POST /api/sync` with both new messages (user + assistant). Non-negotiable.

### Pomodoro Timer

- 25-minute work / 5-minute break cycle.
- Launches from any task on the project board.
- On work-session completion, if the user taps "done," call `POST /api/backlog` with `op: "complete"`.

### Priority-Review Mode

- Triggered when Muse's first reply on Sunday or Thursday requests a priority review.
- UI renders the named backlog with drag-and-drop reordering or inline P1-P5 buttons.
- Submit the final order via `POST /api/backlog` with `op: "reorder"` or `op: "set_priority"` as appropriate.

---

## Retired Surfaces — Do Not Build

- No morning or EOD brief screens.
- No daily queue / "today's tasks" view.
- No `chief-briefing.md` renderer.
- No `/api/today` endpoint — deleted.
- No `/api/check-update` endpoint — deleted.

---

## Endpoint Contracts

### POST /api/chief

Headers:
- `Content-Type: application/json`
- `X-Chief-Token: <CHIEF_AUTH_TOKEN>`

Request body:
```json
{
  "message": "string ≤ 2000 chars",
  "conversation": [{ "role": "user|assistant", "content": "string" }],
  "appState": { "...optional UI state": "..." }
}
```
`conversation` contains at most the last 20 turns.

Response:
```json
{
  "text": "string",
  "actions": [{ "type": "...", "...params": "..." }]
}
```

Frontend applies each action in `actions[]` in order by calling the appropriate endpoint.

Action types:

| type | required params |
|---|---|
| `add_to_backlog` | `project_id`, `text`, `priority:1-5`, `done_condition?`, `category?`, `estimated_pomodoros?` |
| `set_task_priority` | `project_id`, `task_id`, `priority:1-5` |
| `complete_backlog_task` | `project_id`, `task_id` |
| `remove_from_backlog` | `project_id`, `task_id` |
| `reorder_backlog` | `project_id`, `order: [task_id, ...]` |
| `add_project` | `name`, `priority?`, `aliases?`, `note?` |
| `archive_project` | `project_id` |
| `activate_project` | `project_id` |

---

### POST /api/transcribe

Request body:
```json
{ "audio": "<base64>", "mimeType": "audio/mp4|audio/webm" }
```

Response:
```json
{ "text": "string" }
```

---

### GET /api/backlog

No query params — returns summary:
```json
{
  "summary": [
    {
      "project_id": "string",
      "project_name": "string",
      "priority": 1,
      "task_count": 4,
      "top": [{ "id": "string", "text": "string", "priority": 1 }]
    }
  ]
}
```
`top` contains at most 3 items.

With `?project_id=X` — returns full backlog:
```json
{
  "backlog": {
    "schema_version": "string",
    "project_id": "string",
    "project_name": "string",
    "tasks": []
  }
}
```

---

### POST /api/backlog

Supported `op` values: `add`, `remove`, `set_priority`, `complete`, `reorder`, `load`.

Full body shapes documented in `api/backlog.js`.

---

### POST /api/project

Supported `op` values: `add`, `archive`, `activate`.

Full body shapes documented in `api/project.js`.

---

### POST /api/sync

Only supported type: `conversation_append`.

Request body:
```json
{
  "type": "conversation_append",
  "payload": {
    "date": "YYYY-MM-DD",
    "lines": [{ "ts": "ISO8601", "role": "user|assistant", "content": "string" }]
  }
}
```

Must be called after every Muse turn with both new messages. Biweekly review and historical context depend on this.

---

## Task Shape

```ts
type Task = {
  id: string;                       // e.g., "pal-007"
  text: string;                     // ≤ 200 chars
  priority: 1 | 2 | 3 | 4 | 5;     // 1 = highest
  status: "pending" | "done";
  done_condition: string | null;
  category: string | null;
  estimated_pomodoros: number | null;
  created: string;                  // YYYY-MM-DD
  completed?: string;               // YYYY-MM-DD, set when status = done
};
```

---

## PWA Constraints

- Keep `sw.js` and `manifest.json` working.
- Cache the app shell only.
- Never cache API responses.

---

## Error Handling

| Status | Meaning |
|---|---|
| 401 | Bad or missing token |
| 404 | Project or task not found |
| 400 | Validation error |
| 5xx | Server error |

Retry logic is the frontend's responsibility.

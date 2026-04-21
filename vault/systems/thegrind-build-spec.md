> **RETIRED 2026-04-21.** This file describes the pre-rewrite push/queue/brief model. See `vault/systems/muse-system.md` and `vault/systems/OWNERSHIP.md` for the current spec. Kept for historical reference only.

# TheGrind — Build Specification

## What It Is
A mobile-first task execution app powered by an AI agent. The user talks to the agent through voice and text. The agent manages all projects, queues daily work, tracks completions, and adapts. No manual task management — you talk, the agent organizes.

## Core Concept
The app is a window into the agent's brain. The agent always knows what's active, what's next, and what got done. The user interacts through voice prompts — the same way you'd talk to a chief of staff. The agent responds intelligently because it has full context on every project.

---

## Daily Workflow (The 4-Step Loop)

### Step 1: Analyze Active Projects
Every morning, the agent reads the project registry and determines:
- Which projects are active (have pending tasks)
- Health status of each (based on last completion date)
- Any blockers or stalled items

### Step 2: Queue Next 3 Tasks Per Project
The agent pulls the next 3 tasks from each active project's backlog and presents them as today's queue. The queue also includes the day's workout from the training plan.

Rules:
- 3 tasks per active project
- No time assignments — just priority order
- Workout included every day
- Lightweight projects (check-ins) get 1 task
- Goal: complete at least 1 per project to maintain momentum

### Step 3: EOD Check-In (In-App)
At end of day, the user opens the app and talks through what got done. Voice or text. The agent:
- Parses what was completed
- Marks tasks done
- Captures any blockers or notes
- Logs the day's results

This check-in happens INSIDE the app. The agent in the app has the same contextual awareness as any other instance — it knows the projects, the history, the priorities.

### Step 4: Queue Tomorrow
Based on today's results, the agent:
- Rolls incomplete tasks forward (or kills them)
- Pulls next tasks from project backlogs
- Adjusts priority based on what moved and what didn't
- Prepares tomorrow's queue

The cycle repeats daily.

---

## Architecture

### 1. Data Layer

```
/projects/
  {project-id}/
    backlog.json       # Ordered list of all pending tasks
    config.json        # Project metadata (name, category, health rules)
    history.json       # Completed tasks archive

/daily/
  {YYYY-MM-DD}.json    # That day's queue + results

/workouts/
  plan.json            # Full workout program (loaded from PDF)
  schedule.json        # Which workout maps to which day

/agent/
  context.json         # Agent's current awareness state
  project-registry.json # All projects, active/paused/off-board
```

**project-registry.json:**
```json
{
  "projects": [
    {
      "id": "lionmaker-sys",
      "name": "Lionmaker Systems",
      "status": "active",
      "tasks_per_day": 3,
      "category": "On the Business",
      "backlog_source": "projects/lionmaker-sys/backlog.json"
    },
    {
      "id": "grillahq",
      "name": "GrillaHQ",
      "status": "active",
      "tasks_per_day": 3,
      "category": "In the Business",
      "backlog_source": "projects/grillahq/backlog.json"
    },
    {
      "id": "pallister",
      "name": "708 Pallister",
      "status": "lightweight",
      "tasks_per_day": 1,
      "category": "In the Business",
      "backlog_source": "projects/pallister/backlog.json"
    }
  ]
}
```

**backlog.json (per project):**
```json
{
  "project_id": "lionmaker-sys",
  "tasks": [
    {
      "id": "ls-001",
      "text": "Finish CRM integration checklist",
      "done_condition": "CRM connected and pulling data",
      "priority": 1,
      "status": "pending",
      "created": "2026-04-20"
    },
    {
      "id": "ls-002",
      "text": "Record demo walkthrough video",
      "done_condition": "Video recorded and uploaded",
      "priority": 2,
      "status": "pending",
      "created": "2026-04-20"
    }
  ]
}
```

**daily/{date}.json:**
```json
{
  "date": "2026-04-21",
  "queue": [
    {
      "id": "ls-001",
      "text": "Finish CRM integration checklist",
      "project_id": "lionmaker-sys",
      "project_name": "Lionmaker Systems",
      "done_condition": "CRM connected and pulling data",
      "status": "pending",
      "completed_at": null
    }
  ],
  "workout": {
    "name": "KB Complex A",
    "exercises": ["Swings 5x10", "Cleans 5x5", "Press 5x5"],
    "duration": "30 min",
    "status": "pending"
  },
  "results": {
    "tasks_completed": 0,
    "tasks_total": 0,
    "projects_touched": [],
    "workout_done": false,
    "notes": "",
    "score": 0
  }
}
```

### 2. Agent Layer

The agent is the brain. It has read/write access to the entire data layer and maintains full context across sessions.

**What the agent knows at all times:**
- Every active project and its backlog depth
- What was queued today and what got done
- What happened yesterday (and the day before)
- The workout plan for today
- Which projects are stalling (health tracking)
- Blockers the user mentioned

**Agent actions:**
| Trigger | Action |
|---------|--------|
| Morning (automated) | Read backlogs, generate daily queue, push to app |
| User says "what's next" | Show current queue with priority order |
| User says "load more on [project]" | Pull additional tasks from that project's backlog |
| User says "done with [task]" | Mark complete, update results |
| User says "push [task] to tomorrow" | Move task to next day's queue |
| User says "add [task] to [project]" | Append to project backlog |
| User voice dumps EOD | Parse completions, update all statuses, prep tomorrow |
| User asks about a project | Pull full context from backlog + history |

**Context continuity:**
The agent instance inside the app MUST have the same awareness as any other agent instance the user interacts with. This means:
- Shared data layer (both read from / write to the same project files)
- Shared conversation history or summary context
- If the user tells the agent something in one place, the agent knows it everywhere

### 3. Voice Interaction Layer

Voice is the primary input method. The user speaks naturally and the agent interprets.

**Voice-to-Text (STT):**
- User taps a mic button or uses a wake phrase
- Speech converted to text via Whisper or equivalent
- Agent receives the text and processes intent

**Text-to-Speech (TTS):**
- Agent can respond with voice for hands-free operation
- Used for morning queue readout, confirmations, EOD summaries

**Example voice interactions:**
- "What's on my plate today?" → Agent reads today's queue
- "I knocked out the Buildium API setup and the first kettlebell screen" → Agent marks those tasks done
- "Load more on Lionmaker Systems" → Agent pulls next 3 from that backlog
- "Push the UIL wallet setup to tomorrow" → Agent moves it
- "Add a task to Pallister — call the inspector about permits" → Agent appends to backlog
- "What's falling behind?" → Agent reports stalled projects

### 4. UI / Chat Interface

**Main screen: Today's Queue**
- Priority-ordered list of tasks grouped by project
- Each task shows: text, project name, done condition
- Tap to mark done, swipe to push to tomorrow
- Workout card at top or bottom
- Score/streak visible

**Chat/Voice screen:**
- Persistent conversation thread per day
- Agent proactively posts morning queue
- User checks in throughout the day via voice or text
- EOD summary auto-generated
- Full history searchable

**Load More:**
- Button per project OR voice command
- Pulls next batch from that project's backlog
- Adds to today's queue below existing tasks

**No time slots. No calendaring. Just a priority list and a conversation.**

---

## Health & Scoring

**Project Health (auto-calculated):**
- GREEN: Task completed in last 2 days
- YELLOW: 3-5 days since last completion
- RED: 7+ days since last completion
- GRAY: Paused/blocked (no action expected)

**Daily Score:**
- Based on completion rate across queued tasks
- Completing at least 1 per active project = passing day
- Streak = consecutive days with at least 1 completion per project

**Adaptation:**
- Score consistently <50 → agent lightens queue
- Score consistently >90 → agent loads more
- Same task skipped 3+ days → agent breaks it smaller or surfaces the blocker
- Project RED for 2+ weeks → agent flags in daily queue

---

## Tech Stack (Recommended)

| Layer | Options |
|-------|---------|
| Frontend | React Native (iOS + Android) or Next.js PWA |
| Backend API | Vercel serverless functions or lightweight Express |
| Data Store | GitHub repo (JSON files) or Supabase/Firebase |
| Agent Brain | Anthropic Claude API (or any LLM with function calling) |
| STT (Voice In) | OpenAI Whisper API or browser Web Speech API |
| TTS (Voice Out) | ElevenLabs, OpenAI TTS, or browser speechSynthesis |
| Auth | Simple — single user app, API key or OAuth |
| Hosting | Vercel (frontend + API) |

---

## What Makes This Different

1. **No manual task management.** You never drag tasks, set due dates, or organize boards. You talk to the agent and it handles the structure.

2. **Voice-first.** The primary interaction is speaking. Text is the fallback, not the default.

3. **Agent has full context.** It's not a dumb todo list. The agent knows your projects, your history, your patterns. It makes decisions about what to queue and when to push back.

4. **One daily loop.** Morning queue → execute → EOD check-in → tomorrow's queue. That's it. No weekly reviews, no backlog grooming sessions. The agent does that automatically.

5. **Load more on demand.** Default is 3 per project. Want to go deep? Say "load more" and the agent feeds you the next batch. No limit on how much you can work — just a sensible default.

6. **Workout integrated.** Not a separate fitness app. Your training is part of your daily queue, same as your business tasks.

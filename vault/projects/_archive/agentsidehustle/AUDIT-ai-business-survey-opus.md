# ai-business-survey — Opus Audit
Date: 2026-04-03
Repo: https://github.com/lionmaker11/ai-business-survey

## What This Is
A static single-page HTML survey and video transcription archive. The survey is titled "Autonomous AI Business System — Discovery Survey" and appears to be a market research tool. Contains two video transcription files (likely interview or research videos). No backend, no database, no API integrations — pure static HTML + VTT/TXT files.

## Tech Stack
Languages: HTML, CSS (inline in index.html)
Frameworks: None (vanilla HTML — no framework)
Databases: None
External Services: Google Fonts (loaded from CDN in HTML)
Deployment: Unknown — likely GitHub Pages or static host (no Procfile, no railway.json)

## Current State
✅ Working:
  - Static survey page renders
  - Two video transcriptions archived (transcription_video1.txt, transcription_video2.txt)
  - Two VTT caption files (video1.en.vtt, video2.en.vtt)

🔨 In progress:
  - Open branch: claude/export-video-transcriptions-5eVUN (likely the transcription extraction work)

📋 Planned:
  - None documented

❌ Broken/placeholder:
  - Unknown deployment URL — unclear if this is live anywhere

## Activity
Last commit: 2026-03-20 — Merge pull request #1 from lionmaker11/claude/export-video-transcriptions-5eVUN
Commits (30d): 3
Branches: claude/export-video-transcriptions-5eVUN, main

## Open Issues / PRs
None

## Health
ABANDONED — 3 commits all concentrated around 2026-03-20, no clear active use case. Appears to be a one-time market research artifact. No development planned.

## External Services (verified from .env.example)
None — no .env.example.

## Cross-Project Links
None verified.

## Questions for T.J.
1. What was this survey for? Was it used for agentsidehustle product research or something else? Does this repo need to be kept?

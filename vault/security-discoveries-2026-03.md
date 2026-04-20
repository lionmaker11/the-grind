# Security Discoveries — March 2026

**Source:** Claude Code session mining (March 24, 2026)  
**Severity:** 2 Critical fixes applied | 1 Architecture review needed

---

## Critical Fixes Applied

### 1. Command Injection Vulnerability (media-attach.js)

**Severity:** Critical  
**Component:** Chief system media attachment service  
**File/Line:** `media-attach.js` line 115  
**Discovery Date:** March 19, 2026

**Vulnerability:**
```javascript
// UNSAFE: filePath directly interpolated into shell command
execSync(`ffprobe -v quiet -print_format json -show_format "${filePath}"`)
```

With a malicious filename like `test"; rm -rf /; echo "`, this becomes:
```bash
ffprobe -v quiet -print_format json -show_format "test"; rm -rf /; echo ""
```

**Attack Vector:** Any user-supplied filename processed by media-attach service.

**Fix Applied:**
```javascript
// SAFE: Use execFileSync with array arguments
execFileSync('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath])
```

**Why it works:** `execFileSync` does NOT invoke a shell — it directly executes the binary with arguments as an array. No interpolation, no shell expansion.

**Status:** ✅ Fixed and verified on March 19, 2026

---

### 2. Special Character Injection Vulnerability (chief-sync.js)

**Severity:** High  
**Component:** Chief Trello ↔ Calendar sync  
**File/Line:** `chief-sync.js` line 143  
**Discovery Date:** March 19, 2026

**Vulnerability:**
```javascript
// UNSAFE: desc embedded in URL query parameter
const url = `https://api.trello.com/1/cards/${id}?desc=${desc}`
```

Card description containing `&`, `=`, `#`, or other URL-special characters corrupts the request:
- `desc=Done when: x & y` → `&` breaks the parameter separator
- `desc=Fix issue #5` → `#` is interpreted as fragment

**Fix Applied:**
```javascript
// SAFE: Move description to JSON request body
const body = { desc }
// Trello request utility properly JSON-encodes and sends Content-Type: application/json
const response = await trelloRequest('PUT', `/cards/${id}`, body)
```

**Why it works:** JSON body encoding properly escapes all special characters. Trello API accepts descriptions in body, not query params.

**Status:** ✅ Fixed and verified on March 19, 2026

---

## Architecture Review Needed

### Gateway Configuration Hot-Reload Behavior

**Discovery:** Not all `openclaw.json` config is hot-reloadable.

**What IS hot-reloadable:**
- `agents.defaults.models`
- `agents.defaults.thinking`

**What is NOT hot-reloadable:**
- `messages.tts.*` (requires full gateway restart)
- Likely others (needs full audit)

**Impact:** The TTS transcription attachment issue persisted even after config change because the gateway detected the change but didn't apply it. Required full restart.

**Action Items:**
1. Audit all OpenClaw config options and document which require restart vs hot-reload
2. Consider adding warning message if user changes non-hot-reloadable config
3. Update OpenClaw dev docs with this information

**Status:** ⏳ Audit needed

---

## Lessons for Future Development

### Rule: Never Interpolate User Input into Shell Commands
- Always use `execFileSync(cmd, args)` with args as array
- Never use `execSync(string)` with interpolation
- Pattern applies to any system that shells out (Python subprocess, Go exec, etc.)

### Rule: Keep Sensitive Data in Request Bodies, Not Query Params
- Query params appear in browser history, server logs, CDN logs
- Sensitive data: descriptions, messages, secrets, PII
- Use POST/PUT with JSON body instead
- URLs are logged everywhere; bodies are not

### Rule: Test Auth Integrations with Edge-Case Values
- Special characters in descriptions (test with & = # ? % + space)
- Empty values (test with "" and null)
- Very long values (test with 10KB descriptions)
- Emoji and UTF-8 (test with 🚀 💀 ❤️)

---

## Related Files
- `SHARED_CONTEXT.md` — Chief architecture patterns including these fixes
- `sessions-mined-2026-03-24.md` — full mining report

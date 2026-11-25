<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TypoLoop - AI Agent Directives & Automated Setup Guide

> **Note for AI Coding Assistants (Antigravity, Cursor, Windsurf, Claude Code, GitHub Copilot, Codex):**
> When the user asks you to **"set up this project"**, **"install models"**, or **"get TypoLoop running"**, follow the exact protocol below.

---

## 1-Click Automated Setup Protocol

Run this command directly in the workspace terminal:
```bash
npm run setup
```
Or execute the 5 phases manually:

### Phase 1: Dependencies
```bash
npm install
```

### Phase 2: Environment Configuration
```bash
cp -n .env.example .env.local || true
```

### Phase 3: Ollama & Gemma Edge Models
TypoLoop uses Google Gemma models via local Ollama for edge biomechanical analysis and adaptive drill generation.
1. Check if Ollama is installed:
   ```bash
   command -v ollama
   ```
2. If installed and the daemon is running, pull the primary models:
   ```bash
   ollama pull gemma2:2b
   ```
   *(Optional for Apple Silicon / high-VRAM machines)*:
   ```bash
   ollama pull gemma4:e2b || true
   ```
3. If Ollama is **not installed**, inform the user:
   - macOS: `brew install ollama && ollama serve`
   - Linux: `curl -fsSL https://ollama.com/install.sh | sh`
   - Windows: Download from https://ollama.com/download
   - **Note:** TypoLoop includes a built-in **Offline Heuristic Diagnostics Engine** and curated passages, so the application functions completely even without Ollama installed.

### Phase 4: Verification
Execute all unit and integration tests:
```bash
npm test
```
All 23 test suites must pass.

### Phase 5: Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in the browser.

---

## Project Architecture Overview

* **Framework:** Next.js 16 (App Router + Turbopack) & React 19.
* **Biomechanical Telemetry:**
  - `src/lib/analyzer.ts`: Physical keyboard matrix distance, fat-finger classification, and IKI (inter-keystroke intervals).
  - `src/lib/keyboard-layout.ts`: QWERTY physical coordinates, finger attribution, and hand balance.
  - `src/lib/storage.ts`: Longitudinal mastery profile aggregator, 10-session rolling baseline, streak tracker, and chronic troublemaker bigram lifecycle.
  - `src/lib/sound.ts`: High-performance Web Audio API synthesizer for mechanical switch acoustics (Brown, Blue, Red, Thock, Bubble).
* **AI Engine & Fallbacks (`src/app/api/`):**
  - `/api/analyze`: Submits diagnostics to Ollama (`gemma2:2b` / `gemma4:e2b`) or Google Gemini Cloud API; automatically falls back to deterministic heuristic diagnostics if offline.
  - `/api/generate-text`: Adaptive drill generation incorporating user's weak bigrams and hesitation keys; falls back to 22 curated coffeehouse passages if offline.

---

## Testing & Verification Commands
* Run tests: `npm test`
* Run linter: `npm run lint`
* Production build: `npm run build`

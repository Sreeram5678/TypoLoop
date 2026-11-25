#!/usr/bin/env bash
set -e

# ==============================================================================
# TypoLoop - Automated Environment & Model Setup Script
# Works on macOS, Linux, and Windows (via WSL / Git Bash)
# ==============================================================================

echo "[1/5] Checking Node.js environment..."
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Please install Node.js v18+ (https://nodejs.org)."
  exit 1
fi
echo "  -> Node.js $(node -v) detected."

echo "[2/5] Installing npm dependencies..."
npm install

echo "[3/5] Setting up local environment configuration..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  -> Created .env.local from .env.example."
else
  echo "  -> .env.local already exists."
fi

echo "[4/5] Checking Ollama installation and Gemma models..."
if command -v ollama >/dev/null 2>&1; then
  echo "  -> Ollama CLI detected."
  
  # Ensure Ollama daemon is active
  if ! curl -s http://localhost:11434/api/version >/dev/null 2>&1; then
    echo "  -> Starting Ollama in the background..."
    ollama serve >/dev/null 2>&1 &
    sleep 3
  fi

  echo "  -> Pulling Google Gemma 2 2B (lightweight model, ~1.6GB)..."
  ollama pull gemma2:2b || echo "  -> WARNING: Could not pull gemma2:2b, will use heuristic fallback."

  # Attempt pulling gemma4:e2b if available in Ollama registry
  echo "  -> Checking for Gemma 4 (gemma4:e2b)..."
  ollama pull gemma4:e2b >/dev/null 2>&1 || echo "  -> NOTE: gemma4:e2b not in local registry yet; gemma2:2b is ready."
else
  echo "  -> NOTE: Ollama is not installed on this system."
  echo "     TypoLoop will run smoothly in 'Offline Heuristic Engine' mode."
  echo "     To enable local edge AI, install Ollama from https://ollama.com and run: ollama pull gemma2:2b"
fi

echo "[5/5] Running verification tests..."
npm test

echo ""
echo "=============================================================================="
echo "TypoLoop setup complete."
echo "Run 'npm run dev' and open http://localhost:3000 in your browser."
echo "=============================================================================="

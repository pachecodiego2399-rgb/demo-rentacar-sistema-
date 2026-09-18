#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if [ ! -d "$HOME/.claude/skills/find-skills" ]; then
  npx --yes skills add https://github.com/vercel-labs/skills --skill find-skills -g -y || true
fi

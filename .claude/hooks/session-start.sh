#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if [ ! -d "$HOME/.claude/skills/find-skills" ]; then
  npx --yes skills add https://github.com/vercel-labs/skills --skill find-skills -g -y || true
fi

if [ ! -d "$HOME/.claude/skills/web-design-guidelines" ]; then
  npx --yes skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -g -y || true
fi

if [ ! -d "$HOME/.claude/skills/mcp-builder" ]; then
  npx --yes skills add https://github.com/anthropics/skills --skill mcp-builder -g -y || true
fi

if [ ! -d "$HOME/.claude/skills/frontend-design" ]; then
  npx --yes skills add https://github.com/anthropics/skills --skill frontend-design -g -y || true
fi

if [ ! -d "$HOME/.claude/skills/agent-browser" ]; then
  npx --yes skills add https://github.com/vercel-labs/agent-browser -g -y || true
fi

if [ -d "$CLAUDE_PROJECT_DIR/.claude/skill-sources/sales-psychology" ]; then
  mkdir -p "$HOME/.claude/skills"
  rm -rf "$HOME/.claude/skills/sales-psychology"
  cp -r "$CLAUDE_PROJECT_DIR/.claude/skill-sources/sales-psychology" "$HOME/.claude/skills/sales-psychology" || true
fi

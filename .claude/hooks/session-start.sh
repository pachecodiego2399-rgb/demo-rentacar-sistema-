#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if [ ! -d "$HOME/.claude/skills/find-skills" ]; then
  npx --yes skills add https://github.com/vercel-labs/skills --skill find-skills -g -y || true
fi

mkdir -p "$HOME/.claude/skills"
rm -rf "$HOME/.claude/skills/sales-psychology"
cp -r "$CLAUDE_PROJECT_DIR/.claude/skill-sources/sales-psychology" "$HOME/.claude/skills/sales-psychology"

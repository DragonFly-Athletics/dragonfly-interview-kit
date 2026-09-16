#!/usr/bin/env bash
# Interview kit: end.sh
# Stages your work and creates a single commit. Run this AFTER you have
# finished the interview.
#
# Environment overrides:
#   SKIP_COMMIT=1   skip the actual git commit (used by smoke tests)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

cd "$REPO_ROOT"

if [ ! -d .git ]; then
    echo "✖ Not a git repository. Was the project cloned correctly?" >&2
    exit 1
fi

if [ "${SKIP_COMMIT:-0}" = "1" ]; then
    echo "✓ end.sh: working tree ready (SKIP_COMMIT=1 — no commit made)."
    git status --short
    exit 0
fi

git add -A

if git diff --cached --quiet; then
    echo "✖ Nothing to commit. Did you save your work?" >&2
    exit 1
fi

git commit -m "Interview session" --no-verify

echo "✓ Committed. Push instructions:"
echo "  git push origin HEAD"
echo
echo "Share the resulting repo URL with the interviewer."

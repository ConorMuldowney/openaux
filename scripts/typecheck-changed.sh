#!/bin/bash
# Check types only on files changed in current branch
# Usage: ./scripts/typecheck-changed.sh [base-branch]
# Example: ./scripts/typecheck-changed.sh develop

set -e

BASE_BRANCH="${1:-develop}"

# Get list of TypeScript/TSX files changed compared to base branch
CHANGED_FILES=$(git diff --name-only "origin/${BASE_BRANCH}...HEAD" | grep -E '\.(ts|tsx)$' | tr '\n' ' ' || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "No TypeScript files changed compared to origin/$BASE_BRANCH"
  exit 0
fi

echo "TypeScript files changed compared to origin/$BASE_BRANCH:"
echo "$CHANGED_FILES" | tr ' ' '\n'
echo ""
echo "Running typecheck on changed files..."
npx tsc --noEmit $CHANGED_FILES

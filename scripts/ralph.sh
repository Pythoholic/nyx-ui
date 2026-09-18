#!/usr/bin/env bash
# Nyx UI autonomous build loop.
#
# Each iteration starts a FRESH agent context that reads its state from disk
# (docs/architecture/BUILD_LOOP.md) rather than from conversation history.
# Progress accumulates in files and git, never in a context window.
#
# Usage:
#   ./scripts/ralph.sh            # run until the backlog is empty
#   ./scripts/ralph.sh 5          # run at most 5 iterations
#   ./scripts/ralph.sh 1 plan     # dry run: report the next phase, change nothing
#
# Stop with Ctrl+C. Safe to re-run; it resumes from BUILD_LOOP.md.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

MAX_ITERATIONS="${1:-0}"
MODE="${2:-build}"
PROMPT_FILE="docs/architecture/RALPH_PROMPT.md"
BACKLOG_FILE="docs/architecture/BUILD_LOOP.md"
LOG_DIR=".ralph-logs"

mkdir -p "$LOG_DIR"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Missing $PROMPT_FILE" >&2
  exit 1
fi

iteration=0
previous_was_noop=0

while :; do
  iteration=$((iteration + 1))

  if [[ "$MAX_ITERATIONS" -gt 0 && "$iteration" -gt "$MAX_ITERATIONS" ]]; then
    echo "Reached the requested iteration limit of $MAX_ITERATIONS."
    exit 0
  fi

  if ! grep -q '^- \[ \]' "$BACKLOG_FILE"; then
    echo "Backlog is empty. Nothing left to build."
    exit 0
  fi

  remaining=$(grep -c '^- \[ \]' "$BACKLOG_FILE")
  stamp="$(date +%Y%m%d-%H%M%S)"
  log_file="$LOG_DIR/iteration-$stamp.log"

  echo ""
  echo "=== Iteration $iteration | $remaining item(s) remaining | $(date +%H:%M:%S) ==="
  echo "Log: $log_file"

  before_head="$(git rev-parse HEAD)"

  if [[ "$MODE" == "plan" ]]; then
    printf 'MODE: PLAN ONLY. Report the next phase you would implement and stop. Change no files.\n\n%s\n' \
      "$(cat "$PROMPT_FILE")" \
      | codex exec --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort=high - \
      > "$log_file" 2>&1
    echo "Plan written to $log_file"
    exit 0
  fi

  codex exec --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort=high - \
    < "$PROMPT_FILE" > "$log_file" 2>&1
  exit_code=$?

  after_head="$(git rev-parse HEAD)"

  if [[ "$exit_code" -ne 0 ]]; then
    echo "Agent exited with code $exit_code. See $log_file"
  fi

  if [[ "$before_head" == "$after_head" ]]; then
    echo "No commit produced this iteration."
    if [[ "$previous_was_noop" == "1" ]]; then
      echo "Two consecutive iterations produced no commit. Stopping for investigation." >&2
      exit 1
    fi
    previous_was_noop=1
  else
    previous_was_noop=0
    echo "Committed: $(git log --oneline -1)"
  fi

  verify_log="$LOG_DIR/verify-$stamp.log"

  if ! pnpm test > "$verify_log" 2>&1; then
    echo "TESTS FAILING after this iteration. Stopping. See $verify_log" >&2
    exit 1
  fi

  if ! pnpm typecheck >> "$verify_log" 2>&1; then
    echo "TYPECHECK FAILING after this iteration. Stopping. See $verify_log" >&2
    exit 1
  fi

  if ! pnpm build >> "$verify_log" 2>&1; then
    echo "BUILD FAILING after this iteration. Stopping. See $verify_log" >&2
    exit 1
  fi

  echo "Verified: tests, typecheck and build all pass."
done

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

# Accept the mode in either argument position, so `ralph.sh plan` works as
# readily as `ralph.sh 1 plan`.
MAX_ITERATIONS=0
MODE="build"
for arg in "$@"; do
  case "$arg" in
    plan|build) MODE="$arg" ;;
    ''|*[!0-9]*)
      echo "Unrecognized argument: $arg" >&2
      echo "Usage: ralph.sh [max-iterations] [plan|build]" >&2
      exit 2
      ;;
    *) MAX_ITERATIONS="$arg" ;;
  esac
done

PROMPT_FILE="docs/architecture/RALPH_PROMPT.md"
BACKLOG_FILE="docs/architecture/BUILD_LOOP.md"
LOG_DIR=".ralph-logs"

mkdir -p "$LOG_DIR"

for required in "$PROMPT_FILE" "$BACKLOG_FILE"; do
  if [[ ! -f "$required" ]]; then
    echo "Missing $required" >&2
    exit 1
  fi
done

for tool in codex git pnpm; do
  if ! command -v "$tool" > /dev/null 2>&1; then
    echo "Required tool not on PATH: $tool" >&2
    exit 1
  fi
done

# An agent already working this tree would race this loop, and both would
# commit. A lock file identifies *this* loop's agent, which a bare process
# count cannot: Codex leaves long-lived daemons running between tasks, so
# counting processes reports work that finished hours ago.
LOCK_FILE="$LOG_DIR/ralph.lock"

if [[ -f "$LOCK_FILE" ]]; then
  locked_pid="$(cat "$LOCK_FILE" 2> /dev/null)"
  if [[ -n "$locked_pid" ]] && kill -0 "$locked_pid" 2> /dev/null; then
    echo "Another loop is already running (pid $locked_pid)." >&2
    echo "Stop it first, or remove $LOCK_FILE if it is stale." >&2
    exit 1
  fi
  echo "Clearing a stale lock from pid ${locked_pid:-unknown}."
  rm -f "$LOCK_FILE"
fi

echo $$ > "$LOCK_FILE"

# Installed immediately after acquiring the lock, so no later exit path can
# leave a stale lock behind and block the next run.
release_lock() {
  rm -f "$LOCK_FILE"
}
trap release_lock EXIT

# Uncommitted work would be swept into the agent's first commit and
# attributed to work it did not do.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "The working tree is dirty. Commit or stash before starting the loop." >&2
  git status --short >&2
  exit 1
fi

agent_pid=""

# Without this, Ctrl+C kills the loop but leaves the agent running: mid-edit,
# unsupervised and still spending tokens.
cleanup() {
  echo ""
  echo "Interrupted. Stopping the agent."
  if [[ -n "$agent_pid" ]] && kill -0 "$agent_pid" 2> /dev/null; then
    kill "$agent_pid" 2> /dev/null
    sleep 2
    kill -9 "$agent_pid" 2> /dev/null
  fi
  exit 130
}
trap cleanup INT TERM

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
      > "$LOG_DIR/plan-input-$stamp.txt"
    codex exec --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort=high - \
      < "$LOG_DIR/plan-input-$stamp.txt" > "$log_file" 2>&1 &
    agent_pid=$!
    wait "$agent_pid"
    agent_pid=""
    echo "Plan written to $log_file"
    if [[ -n "$(git status --porcelain)" ]]; then
      echo "WARNING: plan mode modified the working tree. Review before continuing." >&2
      git status --short >&2
    fi
    exit 0
  fi

  # Backgrounded so the interrupt trap has a PID to kill.
  codex exec --dangerously-bypass-approvals-and-sandbox -c model_reasoning_effort=high - \
    < "$PROMPT_FILE" > "$log_file" 2>&1 &
  agent_pid=$!
  wait "$agent_pid"
  exit_code=$?
  agent_pid=""

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

  # Leftover changes would be silently absorbed into the next iteration's
  # commit, crediting them to unrelated work.
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Uncommitted changes remain after this iteration:" >&2
    git status --short >&2
    echo "Stopping so this can be resolved rather than folded into the next commit." >&2
    exit 1
  fi

  echo "Verified: tests, typecheck and build all pass."

  # A one-line status a reviewer can read without re-running anything.
  {
    echo "iteration: $iteration"
    echo "finished: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "commit: $(git log --oneline -1)"
    echo "remaining: $(grep -c '^- \[ \]' "$BACKLOG_FILE")"
    echo "verified: tests, typecheck and build passed"
  } > "$LOG_DIR/status.txt"
done

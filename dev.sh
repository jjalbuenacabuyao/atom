#!/usr/bin/env bash
# Runs the Atom API (Go) and web client (Angular) together for local development.
#
#   ./dev.sh            start both; Ctrl+C stops both
#   NO_RELOAD=1 ./dev.sh  run the API with `go run` instead of air live reload
#
# Environment overrides: DATABASE_URL, WEB_PORT (default 4200). The API always
# listens on :8080 because the client's dev proxy (client/proxy.conf.json) targets it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_PORT=8080
WEB_PORT="${WEB_PORT:-4200}"
export DATABASE_URL="${DATABASE_URL:-postgres://atom:atom@localhost:5432/atom?sslmode=disable}"

if [[ -t 1 ]]; then
  BLUE=$'\e[34m' MAGENTA=$'\e[35m' RED=$'\e[31m' YELLOW=$'\e[33m' BOLD=$'\e[1m' RESET=$'\e[0m'
else
  BLUE='' MAGENTA='' RED='' YELLOW='' BOLD='' RESET=''
fi
info() { echo "${BOLD}==>${RESET} $*"; }
warn() { echo "${YELLOW}warning:${RESET} $*" >&2; }
die() { echo "${RED}error:${RESET} $*" >&2; exit 1; }

# --- Locate a working Go toolchain -------------------------------------------
# Some snap installs ship a `go` wrapper that prints nothing, so verify each
# candidate actually runs before using it.
find_go() {
  local candidate
  for candidate in "$(command -v go 2>/dev/null || true)" /snap/go/current/bin/go /usr/local/go/bin/go "$HOME/sdk/go/bin/go"; do
    if [[ -n "$candidate" && -x "$candidate" ]] && "$candidate" version 2>/dev/null | grep -q '^go version'; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

GO_BIN="$(find_go)" || die "Go not found. Install Go 1.27+ (https://go.dev/dl/)."
export PATH="$(dirname "$GO_BIN"):$("$GO_BIN" env GOPATH)/bin:$PATH"
command -v npm >/dev/null || die "npm not found. Install Node.js 24+."

# --- Pre-flight checks -------------------------------------------------------
port_in_use() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
port_in_use "$API_PORT" && die "port $API_PORT is already in use (is the API already running?)"
port_in_use "$WEB_PORT" && die "port $WEB_PORT is already in use (is the web client already running?)"

if command -v psql >/dev/null; then
  psql "$DATABASE_URL" -qtAc 'SELECT 1' >/dev/null 2>&1 ||
    die "cannot connect to PostgreSQL at $DATABASE_URL — is it running and is the 'atom' database created? (see README)"
else
  warn "psql not found; skipping database connectivity check"
fi

if [[ ! -d "$ROOT/client/node_modules" ]]; then
  info "Installing client dependencies (first run)…"
  (cd "$ROOT/client" && npm install)
fi

# --- Start both processes ----------------------------------------------------
# Stop everything started by this script on Ctrl+C, termination, or when either
# process exits.
cleanup() {
  trap - INT TERM EXIT
  echo
  info "Shutting down…"
  kill 0 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

prefix() { sed -u "s/^/$1 /"; }

if [[ -z "${NO_RELOAD:-}" ]] && command -v air >/dev/null; then
  API_CMD=(air)
  api_mode="air live reload"
else
  API_CMD=("$GO_BIN" run ./cmd/api)
  api_mode="go run"
fi

info "Starting API on :$API_PORT ($api_mode, $("$GO_BIN" version | awk '{print $3}'))"
(cd "$ROOT/server" && PORT="$API_PORT" exec "${API_CMD[@]}") 2>&1 | prefix "${BLUE}[api]${RESET}" &

info "Starting web client on :$WEB_PORT"
(cd "$ROOT/client" && exec npx ng serve --port "$WEB_PORT") 2>&1 | prefix "${MAGENTA}[web]${RESET}" &

info "Open ${BOLD}http://localhost:$WEB_PORT${RESET} — press Ctrl+C to stop both."

# Exit (and trigger cleanup) as soon as either process stops.
wait -n

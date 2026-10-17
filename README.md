# Atom

**Tiny habits, remarkable results.** Atom is a habit tracker built on the ideas in
*Atomic Habits*: identity-based habits, the Four Laws of Behavior Change, the Habits
Scorecard, and "never miss twice".

| Layer    | Stack                                                                         |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | Angular 22 (standalone, zoneless, signals, Signal Forms) + Angular Material 3 |
| Backend  | Go 1.27, Gin, GORM, goose migrations, slog                                    |
| Database | PostgreSQL 16                                                                 |

## Features

- **Identities** – decide who you want to become ("I am a reader"); every check-in is a
  *vote* for an identity, and Atom tallies them.
- **Habit designer** – a guided stepper through the Four Laws:
  1. *Make it obvious*: implementation intention ("I will [behaviour] at [time] in
     [location]") and habit stacking ("After [current habit], I will [new habit]").
  2. *Make it attractive*: temptation bundling.
  3. *Make it easy*: the two-minute rule.
  4. *Make it satisfying*: an immediate reward.

  Habits you want to **break** use the inversions: invisible, unattractive, difficult and
  unsatisfying.
- **Today** – check off the day's habits, with a progress ring, streaks, identity votes
  and a 26-week activity heatmap.
- **Never miss twice** – a reminder when you missed the previous scheduled day.
- **Habit tracker** – per-habit calendar (tap any day to log or undo it), current and longest
  streaks, 30-day completion rate and the "1% better" compound factor (1.01^votes).
- **Habits Scorecard** – list your daily routine and rate each behaviour `+`, `=` or `−`.
  Turn a negative one into a "break" habit with one click.
- **Weekday schedules** – unscheduled days never break a streak.
- Light and dark themes; responsive layout with an M3 navigation drawer on desktop and a
  navigation bar on mobile.

## Quick start (local development)

Prerequisites: Go 1.27+, Node 24+, PostgreSQL 16.

```bash
# 1. Database (once)
psql -U postgres -c "CREATE ROLE atom LOGIN PASSWORD 'atom'"
psql -U postgres -c "CREATE DATABASE atom OWNER atom"
psql -U postgres -c "CREATE DATABASE atom_test OWNER atom"

# 2. Start the API (:8080) and web app (:4200) together; Ctrl+C stops both
./dev.sh
```

Open http://localhost:4200 and create an account.

`dev.sh` locates a working Go toolchain, checks that PostgreSQL is reachable, installs client
dependencies on first run, and uses [air](https://github.com/air-verse/air) for API live reload
when it is installed (`NO_RELOAD=1 ./dev.sh` to use `go run` instead). Migrations run
automatically when the API starts. To run the halves separately: `cd server && make run` and
`cd client && npm start` (the dev server proxies `/api` to `:8080`).

## Docker

```bash
JWT_SECRET=$(openssl rand -base64 48) docker compose up --build
```

The app is served at http://localhost:8080. nginx serves the SPA and reverse-proxies `/api`
to the Go service, so everything is same-origin.

## Testing & linting

```bash
make test   # Go unit + integration tests (needs atom_test DB) and Vitest unit tests
make lint   # go vet, golangci-lint, ESLint (angular-eslint), Prettier
```

The Go integration tests in `server/internal/handler` drive the full HTTP API against a real
PostgreSQL database and are skipped unless `TEST_DATABASE_URL` is set.

## Architecture

```
dev.sh                     runs API + web client together for local development
server/
  cmd/api/                 entrypoint: config, logging, migrations, graceful shutdown
  internal/config/         12-factor configuration from environment variables
  internal/database/       GORM connection pool + embedded goose SQL migrations
  internal/model/          GORM models
  internal/repository/     data access (every query scoped to the user, context-aware)
  internal/service/        business logic behind small consumer-side interfaces
  internal/habitstats/     pure streak / completion-rate / never-miss-twice logic
  internal/handler/        Gin routes, request binding & validation, error mapping
  internal/middleware/     request ID, structured logging, recovery, security headers,
                           auth, CSRF, rate limiting, body limits
client/src/app/
  core/                    API clients, auth state, guards, interceptors, utilities
  layout/                  application shell (navigation drawer / bar, toolbar)
  shared/                  reusable components (heatmap, progress ring, time field…)
  features/                lazy-loaded pages: auth, today, habits, identities, scorecard, guide
```

### API

All endpoints live under `/api/v1` and exchange JSON. Errors use a consistent envelope:
`{"error": {"code": "validation_failed", "message": "…", "fields": {"email": "…"}}}`.

| Method & path                                        | Description                                    |
| ---------------------------------------------------- | ---------------------------------------------- |
| `POST /auth/register`, `/auth/login`                 | Create account / sign in (sets session cookie) |
| `POST /auth/logout`, `GET /auth/me`                  | Sign out / current user                        |
| `GET /dashboard?today=YYYY-MM-DD`                    | Daily overview, identities, 26-week activity   |
| `GET/POST /habits`, `PUT /habits/order`              | List (with stats) / create / reorder           |
| `GET/PUT/DELETE /habits/:id`                         | Read / update / delete a habit                 |
| `POST /habits/:id/archive`, `/restore`               | Archive or restore                             |
| `GET /habits/:id/logs?from&to`                       | Check-in history                               |
| `PUT/DELETE /habits/:id/logs/:date`                  | Check in / undo a day (idempotent)             |
| `GET/POST /identities`, `PUT/DELETE /identities/:id` | Identities with vote counts                    |
| `GET/POST /scorecard`, `PUT/DELETE /scorecard/:id`   | Habits Scorecard entries                       |
| `GET /healthz`, `GET /readyz`                        | Liveness and readiness (DB ping) probes        |

Dates are calendar dates in the user's local time zone; the client sends `today` because only
the browser knows the user's zone.

### Security

- Sessions are HS256 JWTs in an **HttpOnly, SameSite=Lax** cookie (`Secure` in production) and
  are never exposed to JavaScript.
- **CSRF**: double-submit cookie (`XSRF-TOKEN` → `X-XSRF-TOKEN`), which Angular's `HttpClient`
  handles automatically.
- Passwords hashed with bcrypt; constant-time behaviour for unknown emails.
- Per-IP rate limiting on login/registration, 1 MiB request body limit, strict security
  headers and CSP, trusted-proxy configuration for client IPs.
- All data access is scoped to the authenticated user; foreign IDs return 404.

### Configuration

See [`server/.env.example`](server/.env.example) for all environment variables.

---

Concepts from *Atomic Habits* by James Clear. Atom is an independent project and is not
affiliated with the author.

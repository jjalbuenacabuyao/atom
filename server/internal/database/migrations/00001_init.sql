-- +goose Up
-- +goose StatementBegin
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

-- "Every action you take is a vote for the type of person you wish to become."
CREATE TABLE identities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    statement   TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX identities_user_id_idx ON identities (user_id);

CREATE TABLE habits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    identity_id     UUID        REFERENCES identities (id) ON DELETE SET NULL,
    name            TEXT        NOT NULL,
    kind            TEXT        NOT NULL DEFAULT 'build' CHECK (kind IN ('build', 'break')),
    -- Law 1: Make it obvious (implementation intention + habit stacking)
    cue_time        TEXT        NOT NULL DEFAULT '',
    cue_location    TEXT        NOT NULL DEFAULT '',
    stack_after     TEXT        NOT NULL DEFAULT '',
    obvious_note    TEXT        NOT NULL DEFAULT '',
    -- Law 2: Make it attractive (temptation bundling)
    attractive_note TEXT        NOT NULL DEFAULT '',
    -- Law 3: Make it easy (two-minute rule)
    easy_note       TEXT        NOT NULL DEFAULT '',
    -- Law 4: Make it satisfying (immediate reward)
    satisfying_note TEXT        NOT NULL DEFAULT '',
    -- Bitmask of scheduled weekdays: bit 0 = Sunday ... bit 6 = Saturday.
    schedule_days   SMALLINT    NOT NULL DEFAULT 127 CHECK (schedule_days BETWEEN 1 AND 127),
    color           TEXT        NOT NULL DEFAULT '#6750A4',
    icon            TEXT        NOT NULL DEFAULT 'bolt',
    position        INTEGER     NOT NULL DEFAULT 0,
    start_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    archived_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX habits_user_id_idx ON habits (user_id, position);
CREATE INDEX habits_identity_id_idx ON habits (identity_id);

CREATE TABLE habit_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id   UUID        NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    date       DATE        NOT NULL,
    note       TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT habit_logs_habit_date_key UNIQUE (habit_id, date)
);
CREATE INDEX habit_logs_user_date_idx ON habit_logs (user_id, date);

-- The Habits Scorecard: become aware of your current behaviour.
CREATE TABLE scorecard_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    description TEXT        NOT NULL,
    rating      TEXT        NOT NULL CHECK (rating IN ('positive', 'negative', 'neutral')),
    time_of_day TEXT        NOT NULL DEFAULT '',
    position    INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scorecard_entries_user_id_idx ON scorecard_entries (user_id, position);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS scorecard_entries;
DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS identities;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd

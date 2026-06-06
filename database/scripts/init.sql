create schema if not exists gralex_db;

CREATE TABLE IF NOT EXISTS gralex_db.health_check (
  id          SERIAL PRIMARY KEY,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note        TEXT
);

INSERT INTO gralex_db.health_check (note) VALUES ('initial bootstrap');
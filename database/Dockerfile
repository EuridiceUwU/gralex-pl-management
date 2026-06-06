# syntax=docker/dockerfile:1.7

# Latest Postgres LTS on Alpine for a small image.
FROM postgres:16-alpine

# Locale / timezone defaults (override via env if needed).
ENV LANG=en_US.utf8 \
    TZ=UTC \
    PGTZ=UTC

# Postgres automatically executes any .sql, .sql.gz, or .sh file placed in
# /docker-entrypoint-initdb.d on first startup (when the data dir is empty).
COPY scripts/ /docker-entrypoint-initdb.d/

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD pg_isready -U "${POSTGRES_USER:-gralex}" -d "${POSTGRES_DB:-gralex}" || exit 1
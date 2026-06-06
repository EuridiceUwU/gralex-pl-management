import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "gralex",
  password: process.env.DB_PASSWORD ?? "gralex",
  database: process.env.DB_NAME ?? "gralex_db",
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[gralex-backend] unexpected pg pool error", err);
});

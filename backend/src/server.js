import "dotenv/config";

import app from "./app.js";
import { pool } from "./config/db.js";
import { ensureBucket } from "./config/minio.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

// Best-effort: make sure the MinIO bucket exists before accepting uploads.
ensureBucket();

const server = app.listen(PORT, HOST, () => {
  const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`[gralex-backend] listening on http://${HOST}:${PORT}`);
  console.log(
    `[gralex-backend] Swagger UI available at http://${displayHost}:${PORT}/api-docs`,
  );
});

const shutdown = (signal) => {
  console.log(`[gralex-backend] received ${signal}, shutting down`);

  server.close(async () => {
    try {
      await pool.end();
    } catch {
      // ignore
    }

    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

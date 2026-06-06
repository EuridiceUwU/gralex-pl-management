import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import healthRoutes from "./routes/health.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import dbRoutes from "./routes/db.routes.js";

import { notFound } from "./middlewares/notFound.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/", healthRoutes);
app.use("/metrics", metricsRoutes);
app.use("/db", dbRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFound);

export default app;

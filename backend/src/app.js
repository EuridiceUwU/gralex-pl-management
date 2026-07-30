import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import healthRoutes from "./routes/health.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import dbRoutes from "./routes/db.routes.js";
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import roleRoutes from "./routes/role.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import shipmentRoutes from "./routes/shipment.routes.js";
import documentRoutes from "./routes/document.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import recordRoutes from "./routes/record.routes.js";

import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/", healthRoutes);
app.use("/metrics", metricsRoutes);
app.use("/db", dbRoutes);
app.use("/auth", authRoutes);
app.use("/employees", employeeRoutes);
app.use("/roles", roleRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/customers", customerRoutes);
app.use("/shipments", shipmentRoutes);
app.use("/documents", documentRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/records", recordRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFound);
app.use(errorHandler);

export default app;

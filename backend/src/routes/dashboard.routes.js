import { Router } from "express";

import * as DashboardController from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Métricas y gráficas del panel
 */

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Métricas agregadas para el dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen, desglose por proveedor y por estado
 */
router.get("/metrics", DashboardController.metrics);

export default router;

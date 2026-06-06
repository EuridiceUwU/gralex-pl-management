import { Router } from "express";

import { metrics } from "../controllers/metrics.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: System metrics
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags: [Metrics]
 *     security: []
 *     responses:
 *       200:
 *         description: Prometheus metrics data
 */
router.get("/", metrics);

export default router;

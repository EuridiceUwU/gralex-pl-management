import { Router } from "express";

import * as healthController from "../controllers/health.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health check
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check system health
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 */
router.get("/health", healthController.health);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Welcome message
 */
router.get("/", healthController.root);

export default router;

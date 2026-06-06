import { Router } from "express";

import { pingDatabase } from "../controllers/db.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Database
 *   description: Database health and operations
 */

/**
 * @swagger
 * /db/ping:
 *   get:
 *     summary: Ping the database
 *     tags: [Database]
 *     security: []
 *     responses:
 *       200:
 *         description: Database is reachable
 *       500:
 *         description: Database is unreachable
 */
router.get("/ping", pingDatabase);

export default router;

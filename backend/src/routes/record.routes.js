import { Router } from "express";

import * as RecordController from "../controllers/record.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Historial de cambios (auditoría) — solo administradores
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Lista el historial de cambios con filtros y paginación
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [Agregó, Editó, Eliminó] }
 *       - in: query
 *         name: tableName
 *         schema: { type: string, example: Customers }
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Lista paginada de registros de auditoría }
 */
router.get("/", RecordController.list);

/**
 * @swagger
 * /records/tables:
 *   get:
 *     summary: Lista los nombres de tabla presentes en el historial (para el filtro de módulo)
 *     tags: [Records]
 *     responses:
 *       200: { description: Lista de nombres de tabla }
 */
router.get("/tables", RecordController.tables);

/**
 * @swagger
 * /records/export:
 *   get:
 *     summary: Exporta el historial de cambios filtrado a PDF o Excel
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema: { type: string, enum: [pdf, excel] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [Agregó, Editó, Eliminó] }
 *       - in: query
 *         name: tableName
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Archivo PDF o Excel }
 */
router.get("/export", RecordController.exportRecords);

export default router;

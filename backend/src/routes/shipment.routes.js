import { Router } from "express";

import * as ShipmentController from "../controllers/shipment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Shipments
 *   description: Gestión de guías / envíos
 */

/**
 * @swagger
 * /shipments/statuses:
 *   get:
 *     summary: Lista los estados de guía disponibles
 *     tags: [Shipments]
 *     responses:
 *       200: { description: Lista de estados }
 */
router.get("/statuses", ShipmentController.statuses);

/**
 * @swagger
 * /shipments:
 *   get:
 *     summary: Lista las guías (vista detallada)
 *     tags: [Shipments]
 *     responses:
 *       200: { description: Lista de guías }
 *   post:
 *     summary: Registrar una guía
 *     tags: [Shipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ssId, supplierId, customerId, trackingNum]
 *             properties:
 *               ssId: { type: integer, example: 1 }
 *               supplierId: { type: integer, example: 1 }
 *               customerId: { type: integer, example: 1 }
 *               minioId: { type: integer, example: 1 }
 *               trackingNum: { type: string, example: "1234567890" }
 *               senderName: { type: string, example: Gralex }
 *               receiverName: { type: string, example: María López }
 *               senderCp: { type: string, example: "94500" }
 *               receiverCp: { type: string, example: "06000" }
 *               weight: { type: string, example: "2.5" }
 *               service: { type: string, example: Express }
 *               creationDate: { type: string, format: date, example: "2026-06-24" }
 *               cost: { type: number, example: 120.50 }
 *               price: { type: number, example: 180.00 }
 *     responses:
 *       201: { description: Guía registrada }
 */
router.get("/", ShipmentController.list);
router.post("/", ShipmentController.create);

/**
 * @swagger
 * /shipments/{id}:
 *   get: { summary: Obtener guía, tags: [Shipments], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 * /shipments/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de una guía
 *     tags: [Shipments]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ssId]
 *             properties:
 *               ssId: { type: integer, example: 2 }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.get("/:id", ShipmentController.get);
router.patch("/:id/status", ShipmentController.updateStatus);
router.patch("/:id/remove-supplier", ShipmentController.removeSupplier);

export default router;

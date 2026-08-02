import { Router } from "express";

import * as CustomerController from "../controllers/customer.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Gestión de clientes
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Lista los clientes
 *     tags: [Customers]
 *     responses:
 *       200: { description: Lista de clientes }
 *   post:
 *     summary: Crear un cliente
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: María López }
 *               companyName: { type: string, example: Comercializadora MX }
 *               cp: { type: string, example: "94500" }
 *               rfc: { type: string, example: LOMA900101AAA }
 *               phone: { type: string, example: "2299887766" }
 *               email: { type: string, example: maria@empresa.com }
 *               cfdi: { type: string, example: G03 }
 *     responses:
 *       201: { description: Cliente creado }
 */
router.get("/", CustomerController.list);
router.post("/", CustomerController.create);

/**
 * @swagger
 * /customers/{id}:
 *   get: { summary: Obtener cliente, tags: [Customers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   put: { summary: Actualizar cliente, tags: [Customers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   delete: { summary: Dar de baja cliente, tags: [Customers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 */
router.get("/:id", CustomerController.get);
router.put("/:id", CustomerController.update);
router.delete("/:id", CustomerController.remove);

/**
 * @swagger
 * /customers/{id}/shipments:
 *   get:
 *     summary: Lista las guías de un cliente, opcionalmente filtradas por rango de fechas
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Fecha inicial (creation_date) del filtro, opcional
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Fecha final (creation_date) del filtro, opcional
 *     responses:
 *       200:
 *         description: Guías del cliente
 */
router.get("/:id/shipments", CustomerController.listShipments);

/**
 * @swagger
 * /customers/{id}/statement:
 *   get:
 *     summary: Genera el estado de cuenta del cliente (PDF/Excel) y lo registra en el historial
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-06-01"
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-06-30"
 *       - in: query
 *         name: format
 *         required: true
 *         schema: { type: string, enum: [pdf, excel] }
 *     responses:
 *       200:
 *         description: Archivo del estado de cuenta (attachment)
 *         content:
 *           application/pdf: { schema: { type: string, format: binary } }
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       400: { description: "Faltan from/to o format inválido" }
 *       404: { description: Cliente no encontrado }
 */
router.get("/:id/statement", CustomerController.generateStatement);

/**
 * @swagger
 * /customers/{id}/statements:
 *   get:
 *     summary: Lista el historial de estados de cuenta generados para el cliente
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historial de estados de cuenta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 accounts:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Account' }
 */
router.get("/:id/statements", CustomerController.listStatements);

export default router;

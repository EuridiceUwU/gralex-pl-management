import { Router } from "express";

import * as SupplierController from "../controllers/supplier.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Gestión de proveedores (paqueterías)
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Lista los proveedores
 *     tags: [Suppliers]
 *     responses:
 *       200: { description: Lista de proveedores }
 *   post:
 *     summary: Crear un proveedor
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: DHL }
 *               creditAmount: { type: number, example: 50000 }
 *               rfc: { type: string, example: DHL010101AAA }
 *               phone: { type: string, example: "5500000000" }
 *               email: { type: string, example: contacto@dhl.com }
 *     responses:
 *       201: { description: Proveedor creado }
 */
router.get("/", SupplierController.list);
router.post("/", SupplierController.create);

/**
 * @swagger
 * /suppliers/{id}:
 *   get: { summary: Obtener proveedor, tags: [Suppliers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   put: { summary: Actualizar proveedor, tags: [Suppliers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   delete: { summary: Dar de baja proveedor, tags: [Suppliers], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 */
router.get("/:id", SupplierController.get);
router.put("/:id", SupplierController.update);
router.delete("/:id", SupplierController.remove);

/**
 * @swagger
 * /suppliers/{id}/shipments:
 *   get:
 *     summary: Lista las guías de un proveedor, opcionalmente filtradas por rango de fechas
 *     tags: [Suppliers]
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
 *         description: Guías del proveedor
 */
router.get("/:id/shipments", SupplierController.listShipments);

/**
 * @swagger
 * /suppliers/{id}/statement:
 *   get:
 *     summary: Genera el estado de cuenta del proveedor (PDF/Excel, por costo) y lo registra en el historial
 *     tags: [Suppliers]
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
 *       404: { description: Proveedor no encontrado }
 */
router.get("/:id/statement", SupplierController.generateStatement);

/**
 * @swagger
 * /suppliers/{id}/statements:
 *   get:
 *     summary: Lista el historial de estados de cuenta generados para el proveedor
 *     tags: [Suppliers]
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
router.get("/:id/statements", SupplierController.listStatements);

export default router;

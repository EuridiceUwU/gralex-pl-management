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

export default router;

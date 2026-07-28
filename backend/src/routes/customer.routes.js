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
router.get("/:id/shipments", CustomerController.listShipments);
router.get("/:id/statement", CustomerController.generateStatement);
router.get("/:id/statements", CustomerController.listStatements);

export default router;

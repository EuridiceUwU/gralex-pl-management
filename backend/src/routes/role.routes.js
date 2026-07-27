import { Router } from "express";

import * as RoleController from "../controllers/role.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles / puestos
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Lista los roles
 *     tags: [Roles]
 *     responses:
 *       200: { description: Lista de roles }
 *   post:
 *     summary: Crear un rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName, salary]
 *             properties:
 *               roleName: { type: string, example: Operador }
 *               salary: { type: number, example: 8500.00 }
 *               description: { type: string, example: Captura de guías }
 *     responses:
 *       201: { description: Rol creado }
 */
router.get("/", RoleController.list);
router.post("/", RoleController.create);

/**
 * @swagger
 * /roles/{id}:
 *   get: { summary: Obtener rol, tags: [Roles], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   put: { summary: Actualizar rol, tags: [Roles], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 *   delete: { summary: Dar de baja rol, tags: [Roles], parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: OK } } }
 */
router.get("/:id", RoleController.get);
router.put("/:id", RoleController.update);
router.delete("/:id", RoleController.remove);

export default router;

import { Router } from "express";

import * as EmployeeController from "../controllers/employee.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Gestión de empleados y usuarios
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Lista todos los empleados
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Lista de empleados
 *   post:
 *     summary: Registrar un nuevo empleado (con usuario opcional)
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId, name, email]
 *             properties:
 *               roleId: { type: integer, example: 1 }
 *               name: { type: string, example: Juan Pérez }
 *               email: { type: string, example: juan.perez@gralex.com }
 *               phone: { type: string, example: "5512345678" }
 *               restDays:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Sábado", "Domingo"]
 *               password: { type: string, example: secret123 }
 *     responses:
 *       201:
 *         description: Empleado registrado
 *       400:
 *         description: Faltan campos obligatorios
 */
router.get("/", EmployeeController.allEmployees);
router.post("/", EmployeeController.newEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Obtener un empleado por ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Empleado encontrado }
 *       404: { description: No encontrado }
 *   put:
 *     summary: Actualizar un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Empleado actualizado }
 *   delete:
 *     summary: Dar de baja un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Empleado dado de baja }
 */
router.get("/:id", EmployeeController.getEmployee);
router.put("/:id", EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);

export default router;

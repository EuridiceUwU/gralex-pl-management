import { Router } from "express";

import * as EmployeeController from "../controllers/employee.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Gestión de empleados y usuarios
 */

/**
 * @swagger
 * /employees/new-employee:
 *   post:
 *     summary: Registrar un nuevo empleado
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre completo del empleado
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico único del empleado
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña de acceso
 *                 example: password123
 *               role:
 *                 type: string
 *                 description: Rol asignado al empleado en la plataforma
 *                 example: Administrador
 *     responses:
 *       201:
 *         description: Empleado registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Empleado registrado exitosamente
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID autogenerado del empleado
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Juan Pérez
 *                     email:
 *                       type: string
 *                       example: juan.perez@example.com
 *                     role:
 *                       type: string
 *                       example: Administrador
 *       400:
 *         description: Petición incorrecta por falta de campos obligatorios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Todos los campos son obligatorios
 *       500:
 *         description: Error interno del servidor al procesar el registro
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al registrar empleado
 */
router.post("/new-employee", EmployeeController.newEmployee);

/**
 * @swagger
 * /employees/all-employees:
 *   get:
 *     summary: Obtiene la lista de todos los empleados
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Lista de empleados obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Juan Pérez
 *                       email:
 *                         type: string
 *                         example: juan.perez@example.com
 *                       role:
 *                         type: string
 *                         example: Administrador
 *       500:
 *         description: Error interno del servidor al consultar la lista de empleados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error al consultar la lista de empleados
 */
router.get("/all-employees", EmployeeController.allEmployees);

export default router;

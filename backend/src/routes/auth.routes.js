import { Router } from "express";

import * as AuthController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y sesión
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener un JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@gralex.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener el usuario autenticado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/me", requireAuth, AuthController.me);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NuevaClave123
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Contraseña inválida
 *       401:
 *         description: No autenticado
 */
router.post("/change-password", requireAuth, AuthController.changePassword);

export default router;

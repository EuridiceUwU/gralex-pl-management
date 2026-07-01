import { Router } from "express";
import multer from "multer";

import * as DocumentController from "../controllers/document.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Keep files in memory; they are streamed straight to MinIO / the OCR service.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Subida de guías a MinIO y lectura por OCR
 */

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Lista los documentos registrados
 *     tags: [Documents]
 *     responses:
 *       200: { description: Lista de documentos }
 */
router.get("/", DocumentController.list);

/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Subir un documento (PDF/imagen) a MinIO
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [Guía, Reporte, Constancia SAT]
 *               notes:
 *                 type: string
 *     responses:
 *       201: { description: Documento subido }
 *       400: { description: Archivo no proporcionado }
 */
router.post("/upload", upload.single("file"), DocumentController.upload);

/**
 * @swagger
 * /documents/ocr:
 *   post:
 *     summary: Leer un PDF/imagen con el microservicio OCR (texto crudo)
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Texto extraído y campos (vacíos por ahora) }
 *       502: { description: El servicio OCR no respondió }
 */
router.post("/ocr", upload.single("file"), DocumentController.ocr);

/**
 * @swagger
 * /documents/confirm-shipment:
 *   post:
 *     summary: Confirmar una guía escaneada — sube el archivo a MinIO y crea la guía
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, trackingNum]
 *             properties:
 *               file: { type: string, format: binary }
 *               trackingNum: { type: string }
 *               carrier: { type: string, enum: [Fedex, DHL, Estafeta, Paquetexpress, Otro] }
 *               carrierOther: { type: string }
 *               service: { type: string, enum: [Express, Terrestre, Internacional] }
 *               senderName: { type: string }
 *               receiverName: { type: string }
 *               senderCp: { type: string }
 *               receiverCp: { type: string }
 *               weight: { type: string }
 *               creationDate: { type: string, format: date }
 *               ssId: { type: integer }
 *               customerId: { type: integer }
 *               supplierId: { type: integer }
 *               cost: { type: number }
 *               price: { type: number }
 *     responses:
 *       201: { description: Guía registrada }
 *       400: { description: Datos inválidos }
 */
router.post("/confirm-shipment", upload.single("file"), DocumentController.confirmShipment);

/**
 * @swagger
 * /documents/url:
 *   get:
 *     summary: Obtener una URL firmada de descarga
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: minio_key del documento (ej. guía/uuid.pdf)
 *     responses:
 *       200: { description: URL firmada }
 *       404: { description: No encontrado }
 */
router.get("/url", DocumentController.getUrl);

export default router;

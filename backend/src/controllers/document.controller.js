import { randomUUID } from "node:crypto";

import axios from "axios";

import * as DocumentModel from "../models/document.model.js";
import { minioClient, bucket } from "../config/minio.js";
import { ocrConfig } from "../config/ocr.js";

const DOCUMENT_TYPES = ["Guía", "Reporte", "Constancia SAT"];

export const list = async (_req, res) => {
  const documents = await DocumentModel.listDocuments();
  return res.json({ ok: true, documents });
};

/**
 * Uploads a file to MinIO and registers it in Minio_documents. The object key
 * is randomised to avoid collisions while keeping the original extension.
 */
export const upload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "Archivo no proporcionado (campo 'file')" });
  }

  const documentType = DOCUMENT_TYPES.includes(req.body.documentType)
    ? req.body.documentType
    : "Guía";

  const ext = req.file.originalname.includes(".")
    ? req.file.originalname.slice(req.file.originalname.lastIndexOf("."))
    : "";
  const minioKey = `${documentType.toLowerCase().replace(/\s+/g, "-")}/${randomUUID()}${ext}`;

  await minioClient.putObject(bucket, minioKey, req.file.buffer, req.file.size, {
    "Content-Type": req.file.mimetype,
  });

  const document = await DocumentModel.createDocument({
    documentType,
    uploadedBy: req.user?.sub ?? null,
    minioKey,
    notes: req.body.notes ?? null,
  });

  return res.status(201).json({ ok: true, message: "Documento subido", document });
};

/**
 * Returns a short-lived presigned URL to download an object from MinIO.
 */
export const getUrl = async (req, res) => {
  const key = req.query.key;

  if (!key) {
    return res.status(400).json({ ok: false, message: "Parámetro 'key' es obligatorio" });
  }

  try {
    const url = await minioClient.presignedGetObject(bucket, key, 60 * 5);
    return res.json({ ok: true, url });
  } catch {
    return res.status(404).json({ ok: false, message: "Documento no encontrado" });
  }
};

/**
 * Proxies an uploaded file to the Python OCR microservice and returns its
 * extracted text. The field mapping is not implemented yet (see /ocr/parser.py);
 * `fields` comes back empty and ready to be filled later.
 */
export const ocr = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "Archivo no proporcionado (campo 'file')" });
  }

  try {
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append("file", blob, req.file.originalname);

    const { data } = await axios.post(`${ocrConfig.baseUrl}/ocr/extract`, form, {
      headers: { Accept: "application/json" },
      maxBodyLength: Infinity,
    });

    return res.json({ ok: true, ...data });
  } catch (error) {
    const status = error.response?.status ?? 502;
    return res.status(status).json({
      ok: false,
      message: "El servicio de OCR no respondió correctamente",
      detail: error.response?.data ?? error.message,
    });
  }
};

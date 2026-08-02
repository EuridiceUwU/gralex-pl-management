import { randomUUID } from "node:crypto";

import axios from "axios";

import * as DocumentModel from "../models/document.model.js";
import * as ShipmentModel from "../models/shipment.model.js";
import { minioClient, bucket } from "../config/minio.js";
import { ocrConfig } from "../config/ocr.js";

const DOCUMENT_TYPES = ["Guía", "Reporte", "Constancia SAT"];
const ALLOWED_CARRIERS = ["Fedex", "DHL", "Estafeta", "Paquetexpress", "Otro"];
const ALLOWED_SERVICES = ["Express", "Terrestre", "Internacional"];

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
 * Streams an object from MinIO through the backend. Preferred over presigned
 * URLs because those point at the internal "minio:9000" host, which the browser
 * cannot resolve. The frontend fetches this as a blob (JWT via the auth header).
 */
export const download = async (req, res) => {
  const key = req.query.key;

  if (!key) {
    return res.status(400).json({ ok: false, message: "Parámetro 'key' es obligatorio" });
  }

  try {
    const stat = await minioClient.statObject(bucket, key);
    res.setHeader("Content-Type", stat.metaData?.["content-type"] ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${key.split("/").pop()}"`);

    const stream = await minioClient.getObject(bucket, key);
    stream.on("error", () => {
      if (!res.headersSent) res.status(500);
      res.end();
    });
    stream.pipe(res);
  } catch {
    return res.status(404).json({ ok: false, message: "Documento no encontrado" });
  }
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
 * extracted text plus the fields detected by /ocr/parser.py.
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

/**
 * Confirms an OCR-scanned guide: stores the file in MinIO, registers it in
 * Minio_documents, and creates the shipment linked to that document in a single
 * request (avoids orphaned documents from a two-call flow). The status defaults
 * to "Etiqueta creada" when ssId is not supplied.
 */
export const confirmShipment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "Archivo no proporcionado (campo 'file')" });
  }

  const b = req.body; // multipart text fields arrive as strings

  if (!b.trackingNum) {
    return res.status(400).json({ ok: false, message: "trackingNum es obligatorio" });
  }

  if (b.carrier && !ALLOWED_CARRIERS.includes(b.carrier)) {
    return res.status(400).json({
      ok: false,
      message: `carrier debe ser uno de: ${ALLOWED_CARRIERS.join(", ")}`,
    });
  }

  if (b.service && !ALLOWED_SERVICES.includes(b.service)) {
    return res.status(400).json({
      ok: false,
      message: `service debe ser uno de: ${ALLOWED_SERVICES.join(", ")}`,
    });
  }

  // Resolve the status: use the provided ssId or default to "Etiqueta creada".
  const statuses = await ShipmentModel.listStatuses();
  const ssId = b.ssId
    ? Number(b.ssId)
    : (statuses.find((s) => s.ss_name === "Etiqueta creada") ?? statuses[0])?.ss_id;

  const ext = req.file.originalname.includes(".")
    ? req.file.originalname.slice(req.file.originalname.lastIndexOf("."))
    : "";
  const minioKey = `guia/${randomUUID()}${ext}`;

  await minioClient.putObject(bucket, minioKey, req.file.buffer, req.file.size, {
    "Content-Type": req.file.mimetype,
  });

  const document = await DocumentModel.createDocument({
    documentType: "Guía",
    uploadedBy: req.user?.sub ?? null,
    minioKey,
    notes: null,
  });

  // Empty multipart strings become null so Cliente/Proveedor/costo/precio stay unset.
  const str = (v) => (v === undefined || v === "" ? null : v);
  const num = (v) => (v === undefined || v === "" ? null : Number(v));

  const shipment = await ShipmentModel.createShipment({
    ssId,
    createdBy: req.user?.sub ?? null,
    supplierId: num(b.supplierId),
    customerId: num(b.customerId),
    minioId: document.minio_id,
    trackingNum: b.trackingNum,
    senderName: str(b.senderName),
    receiverName: str(b.receiverName),
    senderCp: str(b.senderCp),
    receiverCp: str(b.receiverCp),
    weight: str(b.weight),
    service: str(b.service),
    creationDate: b.creationDate || null,
    cost: num(b.cost),
    price: num(b.price),
    carrier: str(b.carrier),
    carrierOther: str(b.carrierOther),
  });

  return res.status(201).json({ ok: true, message: "Guía registrada", document, shipment });
};

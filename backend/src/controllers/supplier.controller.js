import { randomUUID } from "node:crypto";

import * as SupplierModel from "../models/supplier.model.js";
import * as AccountModel from "../models/account.model.js";
import * as DocumentModel from "../models/document.model.js";
import { minioClient, bucket } from "../config/minio.js";
import {
  STATEMENT_FORMATS,
  SUPPLIER_STATEMENT_COLUMNS,
  supplierRowValues,
  buildStatementPdf,
  buildStatementExcel,
} from "../services/statement.service.js";

export const list = async (_req, res) => {
  const suppliers = await SupplierModel.listSuppliers();
  return res.json({ ok: true, suppliers });
};

export const get = async (req, res) => {
  const supplier = await SupplierModel.getSupplier(Number(req.params.id));

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, supplier });
};

export const create = async (req, res) => {
  const { name, creditAmount, rfc, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, message: "name es obligatorio" });
  }

  const supplier = await SupplierModel.createSupplier({
    createdBy: req.user?.sub ?? null,
    name,
    creditAmount: creditAmount ?? null,
    rfc: rfc ?? null,
    phone: phone ?? null,
    email: email ?? null,
  });

  return res.status(201).json({ ok: true, message: "Proveedor creado", supplier });
};

export const update = async (req, res) => {
  const { name, creditAmount, rfc, phone, email, status } = req.body;

  const supplier = await SupplierModel.updateSupplier(
    Number(req.params.id),
    { name, creditAmount, rfc, phone, email, status },
    req.user?.sub ?? null,
  );

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, message: "Proveedor actualizado", supplier });
};

export const remove = async (req, res) => {
  const supplier = await SupplierModel.deleteSupplier(Number(req.params.id), req.user?.sub ?? null);

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, message: "Proveedor dado de baja", supplier });
};

export const listShipments = async (req, res) => {
  const { from, to } = req.query;
  const shipments = await SupplierModel.listShipmentsBySupplier(Number(req.params.id), {
    from: from || undefined,
    to: to || undefined,
  });
  return res.json({ ok: true, shipments });
};

/**
 * Generates a supplier statement ("estado de cuenta") for a date range as a PDF
 * or Excel file, stores it in MinIO/Minio_documents (documentType "Reporte") and
 * records it in Accounts so it shows up in the supplier's statement history, then
 * streams the file back as an attachment. Mirrors customer.controller.js's
 * generateStatement, but totals by cost (what the supplier is owed) instead of
 * price, and uses the reduced supplier column set (no remitente/destinatario/estatus).
 */
export const generateStatement = async (req, res) => {
  const id = Number(req.params.id);
  const { from, to, format } = req.query;

  if (!from || !to) {
    return res.status(400).json({ ok: false, message: "from y to son obligatorios" });
  }

  const formatConfig = STATEMENT_FORMATS[format];
  if (!formatConfig) {
    return res.status(400).json({ ok: false, message: "format debe ser 'pdf' o 'excel'" });
  }

  const supplier = await SupplierModel.getSupplier(id);
  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  const shipments = await SupplierModel.listShipmentsBySupplier(id, { from, to });
  const totalAmount = shipments.reduce((sum, sh) => sum + Number(sh.cost ?? 0), 0);

  const statementArgs = {
    title: `Estado de cuenta - ${supplier.name}`,
    periodFrom: from,
    periodTo: to,
    columns: SUPPLIER_STATEMENT_COLUMNS,
    rows: shipments.map(supplierRowValues),
    totalAmount,
  };
  const buffer =
    format === "pdf"
      ? await buildStatementPdf(statementArgs)
      : await buildStatementExcel(statementArgs);

  const minioKey = `reporte/${randomUUID()}.${formatConfig.ext}`;
  await minioClient.putObject(bucket, minioKey, buffer, buffer.length, {
    "Content-Type": formatConfig.mime,
  });

  const document = await DocumentModel.createDocument({
    documentType: "Reporte",
    uploadedBy: req.user?.sub ?? null,
    minioKey,
    notes: `Estado de cuenta de ${supplier.name} (${from} a ${to})`,
  });

  await AccountModel.createAccount({
    createdBy: req.user?.sub ?? null,
    minioId: document.minio_id,
    startPeriod: from,
    endPeriod: to,
    ownerId: id,
    ownerType: "supplier",
    totalAmount,
  });

  const safeName = supplier.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  res.setHeader("Content-Type", formatConfig.mime);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="estado-cuenta-${safeName}-${from}-${to}.${formatConfig.ext}"`,
  );
  return res.send(buffer);
};

export const listStatements = async (req, res) => {
  const accounts = await AccountModel.listAccountsByOwner("supplier", Number(req.params.id));
  return res.json({ ok: true, accounts });
};

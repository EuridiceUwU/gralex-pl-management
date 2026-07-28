import { randomUUID } from "node:crypto";

import * as CustomerModel from "../models/customer.model.js";
import * as AccountModel from "../models/account.model.js";
import * as DocumentModel from "../models/document.model.js";
import { minioClient, bucket } from "../config/minio.js";
import { buildStatementPdf, buildStatementExcel } from "../services/statement.service.js";

const STATEMENT_FORMATS = {
  pdf: { ext: "pdf", mime: "application/pdf" },
  excel: {
    ext: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
};

export const list = async (_req, res) => {
  const customers = await CustomerModel.listCustomers();
  return res.json({ ok: true, customers });
};

export const get = async (req, res) => {
  const customer = await CustomerModel.getCustomer(Number(req.params.id));

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, customer });
};

export const create = async (req, res) => {
  const { name, companyName, cp, rfc, phone, email, cfdi, constancyDocumentId } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, message: "name es obligatorio" });
  }

  const customer = await CustomerModel.createCustomer({
    createdBy: req.user?.sub ?? null,
    constancyDocumentId: constancyDocumentId ?? null,
    name,
    companyName: companyName ?? null,
    cp: cp ?? null,
    rfc: rfc ?? null,
    phone: phone ?? null,
    email: email ?? null,
    cfdi: cfdi ?? null,
  });

  return res.status(201).json({ ok: true, message: "Cliente creado", customer });
};

export const update = async (req, res) => {
  const { name, companyName, cp, rfc, phone, email, cfdi, status, constancyDocumentId } = req.body;

  const customer = await CustomerModel.updateCustomer(
    Number(req.params.id),
    { name, companyName, cp, rfc, phone, email, cfdi, status, constancyDocumentId },
    req.user?.sub ?? null,
  );

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, message: "Cliente actualizado", customer });
};

export const remove = async (req, res) => {
  const customer = await CustomerModel.deleteCustomer(Number(req.params.id), req.user?.sub ?? null);

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, message: "Cliente dado de baja", customer });
};

export const listShipments = async (req, res) => {
  const { from, to } = req.query;
  const shipments = await CustomerModel.listShipmentsByCustomer(Number(req.params.id), {
    from: from || undefined,
    to: to || undefined,
  });
  return res.json({ ok: true, shipments });
};

/**
 * Generates a customer statement ("estado de cuenta") for a date range as a PDF
 * or Excel file, stores it in MinIO/Minio_documents (documentType "Reporte") and
 * records it in Accounts so it shows up in the customer's statement history, then
 * streams the file back as an attachment.
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

  const customer = await CustomerModel.getCustomer(id);
  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  const shipments = await CustomerModel.listShipmentsByCustomer(id, { from, to });
  const totalAmount = shipments.reduce((sum, sh) => sum + Number(sh.price ?? 0), 0);

  const buffer =
    format === "pdf"
      ? await buildStatementPdf({ customer, shipments, from, to, totalAmount })
      : await buildStatementExcel({ customer, shipments, from, to, totalAmount });

  const minioKey = `reporte/${randomUUID()}.${formatConfig.ext}`;
  await minioClient.putObject(bucket, minioKey, buffer, buffer.length, {
    "Content-Type": formatConfig.mime,
  });

  const document = await DocumentModel.createDocument({
    documentType: "Reporte",
    uploadedBy: req.user?.sub ?? null,
    minioKey,
    notes: `Estado de cuenta de ${customer.name} (${from} a ${to})`,
  });

  await AccountModel.createAccount({
    createdBy: req.user?.sub ?? null,
    minioId: document.minio_id,
    startPeriod: from,
    endPeriod: to,
    ownerId: id,
    ownerType: "customer",
    totalAmount,
  });

  const safeName = customer.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  res.setHeader("Content-Type", formatConfig.mime);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="estado-cuenta-${safeName}-${from}-${to}.${formatConfig.ext}"`,
  );
  return res.send(buffer);
};

export const listStatements = async (req, res) => {
  const accounts = await AccountModel.listAccountsByOwner("customer", Number(req.params.id));
  return res.json({ ok: true, accounts });
};

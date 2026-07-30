import * as RecordModel from "../models/record.model.js";
import {
  STATEMENT_FORMATS,
  RECORD_STATEMENT_COLUMNS,
  recordRowValues,
  buildStatementPdf,
  buildStatementExcel,
} from "../services/statement.service.js";

const parseFilters = (query) => ({
  from: query.from || undefined,
  to: query.to || undefined,
  action: query.action || undefined,
  tableName: query.tableName || undefined,
  userId: query.userId ? Number(query.userId) : undefined,
});

export const list = async (req, res) => {
  const filters = parseFilters(req.query);
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

  const { records, total } = await RecordModel.listRecords({ ...filters, page, pageSize });
  return res.json({ ok: true, records, total, page, pageSize });
};

export const tables = async (_req, res) => {
  const list = await RecordModel.listAuditedTables();
  return res.json({ ok: true, tables: list });
};

export const exportRecords = async (req, res) => {
  const { format } = req.query;
  const formatConfig = STATEMENT_FORMATS[format];
  if (!formatConfig) {
    return res.status(400).json({ ok: false, message: "format debe ser 'pdf' o 'excel'" });
  }

  const filters = parseFilters(req.query);
  const records = await RecordModel.listRecordsForExport(filters);

  const statementArgs = {
    title: "Historial de cambios",
    periodFrom: filters.from ?? records[records.length - 1]?.date ?? new Date(),
    periodTo: filters.to ?? records[0]?.date ?? new Date(),
    columns: RECORD_STATEMENT_COLUMNS,
    rows: records.map(recordRowValues),
  };

  const buffer =
    format === "pdf"
      ? await buildStatementPdf(statementArgs)
      : await buildStatementExcel(statementArgs);

  res.setHeader("Content-Type", formatConfig.mime);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="historial-cambios.${formatConfig.ext}"`,
  );
  return res.send(buffer);
};

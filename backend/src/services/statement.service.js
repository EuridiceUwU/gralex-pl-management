import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export const STATEMENT_FORMATS = {
  pdf: { ext: "pdf", mime: "application/pdf" },
  excel: {
    ext: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
};

export const CUSTOMER_STATEMENT_COLUMNS = [
  { key: "date", label: "Fecha", width: 60 },
  { key: "tracking", label: "Guía", width: 85 },
  { key: "carrier", label: "Paquetería", width: 70 },
  { key: "service", label: "Servicio", width: 65 },
  { key: "sender", label: "Remitente", width: 105 },
  { key: "receiver", label: "Destinatario", width: 105 },
  { key: "weight", label: "Kg", width: 40 },
  { key: "price", label: "Precio", width: 70, money: true },
  { key: "status", label: "Estatus", width: 85 },
];

export const SUPPLIER_STATEMENT_COLUMNS = [
  { key: "date", label: "Fecha", width: 90 },
  { key: "tracking", label: "Guía", width: 140 },
  { key: "carrier", label: "Paquetería", width: 110 },
  { key: "service", label: "Servicio", width: 100 },
  { key: "weight", label: "Kg", width: 60 },
  { key: "cost", label: "Costo", width: 110, money: true },
  { key: "status", label: "Estatus", width: 90 },
];

const TABLE_LABELS = {
  Users: "Usuarios",
  Roles: "Roles",
  Employees: "Empleados",
  Suppliers: "Proveedores",
  Customers: "Clientes",
  Shipments: "Guías",
  Minio_documents: "Documentos",
  Accounts: "Estados de cuenta",
};

export const RECORD_STATEMENT_COLUMNS = [
  { key: "date", label: "Fecha", width: 90 },
  { key: "user", label: "Usuario", width: 130 },
  { key: "action", label: "Acción", width: 70 },
  { key: "table", label: "Módulo", width: 90 },
  { key: "recordRef", label: "Referencia", width: 70 },
];

export const recordRowValues = (r) => ({
  date: formatDate(r.date),
  user: r.user_name || r.user_email || "—",
  action: r.action,
  table: TABLE_LABELS[r.table_name] ?? r.table_name,
  recordRef: r.record_ref,
});

// Mirrors customer-detail/supplier-detail component's paqueteria(): shows
// carrier_other when carrier is "Otro".
const paqueteria = (sh) => (sh.carrier === "Otro" ? sh.carrier_other || "Otro" : sh.carrier || "—");

// pg returns "date" columns as a Date built from local (not UTC) components, so
// this reads them back the same way to avoid an off-by-one shift.
const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

const formatMoney = (value) =>
  `$${Number(value ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Money fields (price/cost) are kept as raw numbers here — buildStatementPdf
// formats them at render time and buildStatementExcel writes them as native
// numeric cells (with a currency numFmt) instead of pre-formatted strings.
export const customerRowValues = (sh) => ({
  date: formatDate(sh.creation_date),
  tracking: sh.tracking_num || "—",
  carrier: paqueteria(sh),
  service: sh.service || "—",
  sender: sh.sender_name || "—",
  receiver: sh.receiver_name || "—",
  weight: sh.weight || "—",
  price: Number(sh.price ?? 0),
  status: sh.status_name || "—",
});

export const supplierRowValues = (sh) => ({
  date: formatDate(sh.creation_date),
  tracking: sh.tracking_num || "—",
  carrier: paqueteria(sh),
  service: sh.service || "—",
  weight: sh.weight || "—",
  cost: Number(sh.cost ?? 0),
  status: sh.status_name || "—",
});

export const buildStatementPdf = ({ title, periodFrom, periodTo, columns, rows, totalAmount }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const rowHeight = 20;
    const bottom = doc.page.height - doc.page.margins.bottom;

    doc.font("Helvetica-Bold").fontSize(16).text(title, left, doc.y);
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Periodo: ${formatDate(periodFrom)} - ${formatDate(periodTo)}`)
      .text(`Generado: ${formatDate(new Date())}`);
    doc.moveDown(0.8);

    const drawHeader = () => {
      const y = doc.y;
      doc.rect(left, y, tableWidth, rowHeight).fill("#f1f5f9");
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9);
      let x = left;
      for (const col of columns) {
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8, ellipsis: true });
        x += col.width;
      }
      doc.fillColor("#000000");
      doc.y = y + rowHeight;
    };

    const drawRow = (values) => {
      if (doc.y + rowHeight > bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeader();
      }
      const y = doc.y;
      doc.font("Helvetica").fontSize(8);
      let x = left;
      for (const col of columns) {
        const text = col.money ? formatMoney(values[col.key]) : String(values[col.key]);
        doc.text(text, x + 4, y + 6, { width: col.width - 8, ellipsis: true });
        x += col.width;
      }
      doc
        .moveTo(left, y + rowHeight)
        .lineTo(left + tableWidth, y + rowHeight)
        .strokeColor("#e2e8f0")
        .stroke();
      doc.y = y + rowHeight;
    };

    drawHeader();
    if (rows.length === 0) {
      doc.font("Helvetica").fontSize(9).text("Sin registros en el periodo seleccionado.", left, doc.y + 6);
      doc.y += rowHeight;
    } else {
      for (const values of rows) drawRow(values);
    }

    // Only shipment-based statements (customers/suppliers) carry a money column;
    // reports like the audit log export have nothing to total.
    if (columns.some((col) => col.money)) {
      if (doc.y + rowHeight > bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }
      doc.moveDown(0.5);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`Total: ${formatMoney(totalAmount)}`, left, doc.y, { width: tableWidth, align: "right" });
    }

    doc.end();
  });

export const buildStatementExcel = async ({ title, periodFrom, periodTo, columns, rows, totalAmount }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estado de cuenta");
  const lastColumn = columns.length;

  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { bold: true, size: 14 };

  sheet.mergeCells(2, 1, 2, lastColumn);
  sheet.getCell(2, 1).value =
    `Periodo: ${formatDate(periodFrom)} - ${formatDate(periodTo)}   |   Generado: ${formatDate(new Date())}`;
  sheet.getCell(2, 1).font = { italic: true, size: 10, color: { argb: "FF64748B" } };

  sheet.addRow([]);

  const headerRow = sheet.addRow(columns.map((col) => col.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const moneyColumnIndex = columns.findIndex((col) => col.money) + 1;

  for (const values of rows) {
    sheet.addRow(columns.map((col) => (col.money ? Number(values[col.key] ?? 0) : values[col.key])));
  }

  const lastDataRow = sheet.lastRow.number;

  // Only shipment-based statements (customers/suppliers) carry a money column;
  // reports like the audit log export have nothing to total.
  if (moneyColumnIndex > 0) {
    const totalRowValues = new Array(lastColumn).fill("");
    totalRowValues[lastColumn - 1] = "Total";
    totalRowValues[moneyColumnIndex - 1] = Number(totalAmount ?? 0);
    const totalRow = sheet.addRow(totalRowValues);
    totalRow.font = { bold: true };
    totalRow.getCell(moneyColumnIndex).numFmt = '"$"#,##0.00';
  }

  const defaultWidths = { date: 12, tracking: 18, carrier: 14, service: 14, sender: 24, receiver: 24, weight: 8, price: 14, cost: 14, status: 16, user: 24, action: 12, table: 16, recordRef: 12 };
  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = defaultWidths[col.key] ?? 16;
  });
  if (moneyColumnIndex > 0) sheet.getColumn(moneyColumnIndex).numFmt = '"$"#,##0.00';

  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: lastDataRow, column: lastColumn },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

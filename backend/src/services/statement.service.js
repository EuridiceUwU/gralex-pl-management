import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const COLUMNS = [
  { key: "date", label: "Fecha", width: 60 },
  { key: "tracking", label: "Guía", width: 85 },
  { key: "carrier", label: "Paquetería", width: 70 },
  { key: "service", label: "Servicio", width: 65 },
  { key: "sender", label: "Remitente", width: 105 },
  { key: "receiver", label: "Destinatario", width: 105 },
  { key: "weight", label: "Kg", width: 40 },
  { key: "price", label: "Precio", width: 70 },
  { key: "status", label: "Estatus", width: 85 },
];

// Mirrors customer-detail.component.ts's paqueteria(): shows carrier_other when
// carrier is "Otro".
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

const rowValues = (sh) => ({
  date: formatDate(sh.creation_date),
  tracking: sh.tracking_num || "—",
  carrier: paqueteria(sh),
  service: sh.service || "—",
  sender: sh.sender_name || "—",
  receiver: sh.receiver_name || "—",
  weight: sh.weight || "—",
  price: formatMoney(sh.price),
  status: sh.status_name || "—",
});

export const buildStatementPdf = ({ customer, shipments, from, to, totalAmount }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const tableWidth = COLUMNS.reduce((sum, col) => sum + col.width, 0);
    const rowHeight = 20;
    const bottom = doc.page.height - doc.page.margins.bottom;

    doc.font("Helvetica-Bold").fontSize(16).text(`Estado de cuenta - ${customer.name}`, left, doc.y);
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Periodo: ${formatDate(from)} - ${formatDate(to)}`)
      .text(`Generado: ${formatDate(new Date())}`);
    doc.moveDown(0.8);

    const drawHeader = () => {
      const y = doc.y;
      doc.rect(left, y, tableWidth, rowHeight).fill("#f1f5f9");
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9);
      let x = left;
      for (const col of COLUMNS) {
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8, ellipsis: true });
        x += col.width;
      }
      doc.fillColor("#000000");
      doc.y = y + rowHeight;
    };

    const drawRow = (sh) => {
      if (doc.y + rowHeight > bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeader();
      }
      const y = doc.y;
      const values = rowValues(sh);
      doc.font("Helvetica").fontSize(8);
      let x = left;
      for (const col of COLUMNS) {
        doc.text(String(values[col.key]), x + 4, y + 6, { width: col.width - 8, ellipsis: true });
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
    if (shipments.length === 0) {
      doc.font("Helvetica").fontSize(9).text("Sin guías en el periodo seleccionado.", left, doc.y + 6);
      doc.y += rowHeight;
    } else {
      for (const shipment of shipments) drawRow(shipment);
    }

    if (doc.y + rowHeight > bottom) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`Total: ${formatMoney(totalAmount)}`, left, doc.y, { width: tableWidth, align: "right" });

    doc.end();
  });

export const buildStatementExcel = async ({ customer, shipments, from, to, totalAmount }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estado de cuenta");

  sheet.mergeCells("A1:I1");
  sheet.getCell("A1").value = `Estado de cuenta - ${customer.name}`;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  sheet.mergeCells("A2:I2");
  sheet.getCell("A2").value =
    `Periodo: ${formatDate(from)} - ${formatDate(to)}   |   Generado: ${formatDate(new Date())}`;
  sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };

  sheet.addRow([]);

  const headerRow = sheet.addRow(COLUMNS.map((col) => col.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const shipment of shipments) {
    sheet.addRow([
      formatDate(shipment.creation_date),
      shipment.tracking_num || "—",
      paqueteria(shipment),
      shipment.service || "—",
      shipment.sender_name || "—",
      shipment.receiver_name || "—",
      shipment.weight || "—",
      Number(shipment.price ?? 0),
      shipment.status_name || "—",
    ]);
  }

  const lastDataRow = sheet.lastRow.number;

  const totalRow = sheet.addRow(["", "", "", "", "", "", "", Number(totalAmount ?? 0), "Total"]);
  totalRow.font = { bold: true };
  totalRow.getCell(8).numFmt = '"$"#,##0.00';

  sheet.getColumn(8).numFmt = '"$"#,##0.00';
  [12, 18, 14, 14, 24, 24, 8, 14, 16].forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: lastDataRow, column: COLUMNS.length },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

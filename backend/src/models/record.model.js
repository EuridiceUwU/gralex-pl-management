import { pool } from "../config/db.js";

// Dynamic WHERE built the same way as listShipmentsBySupplier (supplier.model.js):
// push into conditions/params in lockstep so placeholder numbers stay correct
// regardless of which filters are present. Shared by listRecords (paginated
// screen) and listRecordsForExport (uncapped-ish, PDF/Excel download).
const buildFilters = ({ from, to, action, tableName, userId }) => {
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`"date" >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`"date" < $${params.length}::date + interval '1 day'`);
  }

  if (action) {
    params.push(action);
    conditions.push(`"action" = $${params.length}`);
  }

  if (tableName) {
    params.push(tableName);
    conditions.push(`"table_name" = $${params.length}`);
  }

  if (userId) {
    params.push(userId);
    conditions.push(`"user_id" = $${params.length}`);
  }

  return { conditions, params };
};

export const listRecords = async ({
  from,
  to,
  action,
  tableName,
  userId,
  page = 1,
  pageSize = 20,
} = {}) => {
  const { conditions, params } = buildFilters({ from, to, action, tableName, userId });
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safePageSize;

  params.push(safePageSize, offset);

  const { rows } = await pool.query(
    `SELECT *, COUNT(*) OVER()::int AS "total_count"
       FROM "vw_records_detail"
       ${where}
      ORDER BY "date" DESC, "record_id" DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const total = rows[0]?.total_count ?? 0;
  const records = rows.map(({ total_count, ...record }) => record);

  return { records, total };
};

// Used for PDF/Excel export: same filters, no pagination, capped so an
// unfiltered export of a very old install can't try to render everything.
const EXPORT_LIMIT = 5000;

export const listRecordsForExport = async ({ from, to, action, tableName, userId } = {}) => {
  const { conditions, params } = buildFilters({ from, to, action, tableName, userId });
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT * FROM "vw_records_detail" ${where} ORDER BY "date" DESC, "record_id" DESC LIMIT ${EXPORT_LIMIT}`,
    params,
  );
  return rows;
};

export const listAuditedTables = async () => {
  const { rows } = await pool.query('SELECT DISTINCT "table_name" FROM "Records" ORDER BY "table_name"');
  return rows.map((r) => r.table_name);
};

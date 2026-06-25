import { pool } from "../config/db.js";

export const getMetrics = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_dashboard_metrics"');
  return rows[0] ?? {};
};

export const getBySupplier = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_shipments_by_supplier"');
  return rows;
};

export const getByStatus = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_shipments_by_status"');
  return rows;
};

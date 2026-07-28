import { pool } from "../config/db.js";

export const listCustomers = async () => {
  const { rows } = await pool.query('SELECT * FROM "Customers" ORDER BY "customer_id"');
  return rows;
};

// Joins Minio_documents so the response exposes the constancy's minio_key,
// which the frontend uses to request a presigned download URL.
export const getCustomer = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.*, m."minio_key" AS "constancy_minio_key"
       FROM "Customers" c
       LEFT JOIN "Minio_documents" m ON m."minio_id" = c."constancy_document_id"
      WHERE c."customer_id" = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const listShipmentsByCustomer = async (customerId, { from, to } = {}) => {
  const conditions = ['"customer_id" = $1'];
  const params = [customerId];

  if (from) {
    params.push(from);
    conditions.push(`"creation_date" >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    conditions.push(`"creation_date" <= $${params.length}`);
  }

  const orderBy =
    from || to ? '"creation_date" ASC, "shipment_id" ASC' : '"shipment_id" DESC';

  const { rows } = await pool.query(
    `SELECT * FROM "vw_shipments_detail" WHERE ${conditions.join(" AND ")} ORDER BY ${orderBy}`,
    params,
  );
  return rows;
};

// sp_customer_create returns only the new row's id; the row itself is
// re-fetched with getCustomer so the response uses the real column names.
export const createCustomer = async (c) => {
  const { rows } = await pool.query(
    "CALL sp_customer_create($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)",
    [
      c.createdBy,
      c.constancyDocumentId,
      c.name,
      c.companyName,
      c.cp,
      c.rfc,
      c.phone,
      c.email,
      c.cfdi,
    ],
  );
  return getCustomer(rows[0].new_id);
};

// sp_customer_update/sp_customer_delete are void procedures; passing NULL
// for a field leaves it unchanged (COALESCE inside the procedure).
export const updateCustomer = async (id, c, userId) => {
  await pool.query("CALL sp_customer_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [
    id,
    c.name,
    c.companyName,
    c.cp,
    c.rfc,
    c.phone,
    c.email,
    c.cfdi,
    c.status,
    c.constancyDocumentId,
    userId,
  ]);
  return getCustomer(id);
};

export const deleteCustomer = async (id, userId) => {
  await pool.query("CALL sp_customer_delete($1, $2)", [id, userId]);
  return getCustomer(id);
};

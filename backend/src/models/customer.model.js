import { pool } from "../config/db.js";

export const listCustomers = async () => {
  const { rows } = await pool.query('SELECT * FROM "Customers" ORDER BY "customer_id"');
  return rows;
};

export const getCustomer = async (id) => {
  const { rows } = await pool.query('SELECT * FROM "Customers" WHERE "customer_id" = $1', [id]);
  return rows[0] ?? null;
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
  await pool.query("CALL sp_customer_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [
    id,
    c.name,
    c.companyName,
    c.cp,
    c.rfc,
    c.phone,
    c.email,
    c.cfdi,
    c.status,
    userId,
  ]);
  return getCustomer(id);
};

export const deleteCustomer = async (id, userId) => {
  await pool.query("CALL sp_customer_delete($1, $2)", [id, userId]);
  return getCustomer(id);
};

import { pool } from "../config/db.js";

export const listSuppliers = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_suppliers_with_balance" ORDER BY "supplier_id"');
  return rows;
};

export const getSupplier = async (id) => {
  const { rows } = await pool.query('SELECT * FROM "vw_suppliers_with_balance" WHERE "supplier_id" = $1', [id]);
  return rows[0] ?? null;
};

export const listShipmentsBySupplier = async (supplierId) => {
  const { rows } = await pool.query(
    'SELECT * FROM "vw_shipments_detail" WHERE "supplier_id" = $1 ORDER BY "shipment_id" DESC',
    [supplierId],
  );
  return rows;
};

// sp_supplier_create returns only the new row's id; the row itself is
// re-fetched with getSupplier so the response uses the real column names.
export const createSupplier = async ({ createdBy, name, creditAmount, rfc, phone, email }) => {
  const { rows } = await pool.query("CALL sp_supplier_create($1, $2, $3, $4, $5, $6, NULL)", [
    createdBy,
    name,
    creditAmount,
    rfc,
    phone,
    email,
  ]);
  return getSupplier(rows[0].new_id);
};

// sp_supplier_update/sp_supplier_delete are void procedures; passing NULL
// for a field leaves it unchanged (COALESCE inside the procedure).
export const updateSupplier = async (
  id,
  { name, creditAmount, rfc, phone, email, status },
  userId,
) => {
  await pool.query("CALL sp_supplier_update($1, $2, $3, $4, $5, $6, $7, $8)", [
    id,
    name,
    creditAmount,
    rfc,
    phone,
    email,
    status,
    userId,
  ]);
  return getSupplier(id);
};

export const deleteSupplier = async (id, userId) => {
  await pool.query("CALL sp_supplier_delete($1, $2)", [id, userId]);
  return getSupplier(id);
};

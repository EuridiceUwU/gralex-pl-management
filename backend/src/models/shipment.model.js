import { pool } from "../config/db.js";

export const listShipments = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_shipments_detail" ORDER BY "shipment_id" DESC');
  return rows;
};

export const getShipment = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM "vw_shipments_detail" WHERE "shipment_id" = $1',
    [id],
  );
  return rows[0] ?? null;
};

export const listStatuses = async () => {
  const { rows } = await pool.query('SELECT * FROM "Shipments_status" ORDER BY "ss_id"');
  return rows;
};

// sp_shipment_create returns only the new row's id; the row itself is
// re-fetched with getShipment so the response uses the real column names.
export const createShipment = async (s) => {
  const { rows } = await pool.query(
    "CALL sp_shipment_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NULL)",
    [
      s.ssId,
      s.createdBy,
      s.supplierId,
      s.customerId,
      s.minioId,
      s.trackingNum,
      s.senderName,
      s.receiverName,
      s.senderCp,
      s.receiverCp,
      s.weight,
      s.service,
      s.creationDate,
      s.cost,
      s.price,
    ],
  );
  return getShipment(rows[0].new_id);
};

// sp_shipment_update_status is a void procedure.
export const updateStatus = async (id, ssId, userId) => {
  await pool.query("CALL sp_shipment_update_status($1, $2, $3)", [id, ssId, userId]);
  return getShipment(id);
};

// sp_shipment_remove_supplier is a void procedure.
export const removeSupplier = async (id, userId) => {
  await pool.query("CALL sp_shipment_remove_supplier($1, $2)", [id, userId]);
  return getShipment(id);
};

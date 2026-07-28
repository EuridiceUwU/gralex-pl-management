import { pool } from "../config/db.js";

// sp_account_create returns only the new row's id; the row itself is
// re-fetched so the response uses the real column names.
export const createAccount = async ({
  createdBy,
  minioId,
  startPeriod,
  endPeriod,
  ownerId,
  ownerType,
  totalAmount,
}) => {
  const { rows } = await pool.query("CALL sp_account_create($1, $2, $3, $4, $5, $6, $7, NULL)", [
    createdBy,
    minioId,
    startPeriod,
    endPeriod,
    ownerId,
    ownerType,
    totalAmount,
  ]);
  const { rows: accountRows } = await pool.query(
    'SELECT * FROM "Accounts" WHERE "account_id" = $1',
    [rows[0].new_id],
  );
  return accountRows[0];
};

export const listAccountsByOwner = async (ownerType, ownerId) => {
  const { rows } = await pool.query(
    `SELECT a.*, m."minio_key"
       FROM "Accounts" a
       JOIN "Minio_documents" m ON m."minio_id" = a."minio_id"
      WHERE a."owner_type" = $1 AND a."owner_id" = $2
      ORDER BY a."created_at" DESC`,
    [ownerType, ownerId],
  );
  return rows;
};

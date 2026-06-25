import { pool } from "../config/db.js";

export const listDocuments = async () => {
  const { rows } = await pool.query('SELECT * FROM "Minio_documents" ORDER BY "minio_id" DESC');
  return rows;
};

// sp_document_create returns only the new row's id; the row itself is
// re-fetched so the response uses the real column names.
export const createDocument = async ({ documentType, uploadedBy, minioKey, notes }) => {
  const { rows } = await pool.query("CALL sp_document_create($1, $2, $3, $4, NULL)", [
    documentType,
    uploadedBy,
    minioKey,
    notes,
  ]);
  const { rows: docRows } = await pool.query(
    'SELECT * FROM "Minio_documents" WHERE "minio_id" = $1',
    [rows[0].new_id],
  );
  return docRows[0];
};

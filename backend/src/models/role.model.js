import { pool } from "../config/db.js";

export const listRoles = async () => {
  const { rows } = await pool.query('SELECT * FROM "Roles" ORDER BY "role_id"');
  return rows;
};

export const getRole = async (id) => {
  const { rows } = await pool.query('SELECT * FROM "Roles" WHERE "role_id" = $1', [id]);
  return rows[0] ?? null;
};

// sp_role_create returns only the new row's id; the row itself is re-fetched
// with getRole so the response uses the real column names.
export const createRole = async ({ createdBy, roleName, salary, description }) => {
  const { rows } = await pool.query("CALL sp_role_create($1, $2, $3, $4, NULL)", [
    createdBy,
    roleName,
    salary,
    description,
  ]);
  return getRole(rows[0].new_id);
};

// sp_role_update/sp_role_delete are void procedures; passing NULL for a
// field leaves it unchanged (COALESCE inside the procedure).
export const updateRole = async (id, { roleName, salary, description, status }, userId) => {
  await pool.query("CALL sp_role_update($1, $2, $3, $4, $5, $6)", [
    id,
    roleName,
    salary,
    description,
    status,
    userId,
  ]);
  return getRole(id);
};

export const deleteRole = async (id, userId) => {
  await pool.query("CALL sp_role_delete($1, $2)", [id, userId]);
  return getRole(id);
};

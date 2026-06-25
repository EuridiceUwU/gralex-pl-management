import { pool } from "../config/db.js";

export const listEmployees = async () => {
  const { rows } = await pool.query('SELECT * FROM "vw_employees_detail" ORDER BY "employee_id"');
  return rows;
};

export const getEmployee = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM "vw_employees_detail" WHERE "employee_id" = $1',
    [id],
  );
  return rows[0] ?? null;
};

// sp_employee_update/sp_employee_delete are void procedures; passing NULL
// for a field leaves it unchanged (COALESCE inside the procedure).
export const updateEmployee = async (
  id,
  { roleId, name, restDays, phone, email, status },
  userId,
) => {
  await pool.query("CALL sp_employee_update($1, $2, $3, $4, $5, $6, $7, $8)", [
    id,
    roleId,
    name,
    restDays,
    phone,
    email,
    status,
    userId,
  ]);
  return getEmployee(id);
};

export const deleteEmployee = async (id, userId) => {
  await pool.query("CALL sp_employee_delete($1, $2)", [id, userId]);
  return getEmployee(id);
};

import { pool } from "../config/db.js";

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM "vw_users_detail" WHERE "email" = $1', [
    email,
  ]);
  return rows[0] ?? null;
};

export const findUserById = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM "vw_users_detail" WHERE "user_id" = $1', [
    userId,
  ]);
  return rows[0] ?? null;
};

export const updatePassword = async (userId, hash, actingUser) => {
  await pool.query("CALL sp_user_update_password($1, $2, $3)", [userId, hash, actingUser]);
};

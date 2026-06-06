import { pool } from "../config/db.js";

export const pingDatabase = async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");

    res.json({
      ok: true,
      now: rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

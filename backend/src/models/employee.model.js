import { pool } from "../config/db.js";

export const newEmployee = async (name, email, password, role) => {
    const result = await pool.query('INSERT INTO "Users" (name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *',
        [name, email, password, role]
    );
    return result.rows[0];
}

export const allEmployees = async () => {
    const result = await pool.query('SELECT * FROM "Users"');
    return result.rows;
}

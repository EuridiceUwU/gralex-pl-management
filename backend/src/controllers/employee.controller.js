import bcrypt from "bcryptjs";

import * as EmployeeModel from "../models/employee.model.js";
import { pool } from "../config/db.js";

export const allEmployees = async (_req, res) => {
  const employees = await EmployeeModel.listEmployees();
  return res.json({ ok: true, employees });
};

export const getEmployee = async (req, res) => {
  const employee = await EmployeeModel.getEmployee(Number(req.params.id));

  if (!employee) {
    return res.status(404).json({ ok: false, message: "Empleado no encontrado" });
  }

  return res.json({ ok: true, employee });
};

export const newEmployee = async (req, res) => {
  const { roleId, name, restDays, phone, email, password } = req.body;

  if (!roleId || !name || !email) {
    return res.status(400).json({ ok: false, message: "roleId, name y email son obligatorios" });
  }

  const createdBy = req.user?.sub ?? null;

  // The employee row and its optional login user are created together so an
  // employee can authenticate when a password is provided.
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: empRows } = await client.query(
      "CALL sp_employee_create($1, $2, $3, $4, $5, $6, NULL)",
      [createdBy, roleId, name, restDays ?? null, phone ?? null, email],
    );
    const newEmployeeId = empRows[0].new_id;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await client.query("CALL sp_user_create($1, $2, $3, $4)", [
        newEmployeeId,
        email,
        hash,
        createdBy,
      ]);
    }

    await client.query("COMMIT");

    const employee = await EmployeeModel.getEmployee(newEmployeeId);

    return res.status(201).json({ ok: true, message: "Empleado registrado", employee });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateEmployee = async (req, res) => {
  const { roleId, name, restDays, phone, email, status } = req.body;

  // Un admin no puede desactivar su propia cuenta (sí puede editar sus datos).
  if (status === false && Number(req.params.id) === req.user?.employeeId) {
    return res.status(400).json({ ok: false, message: "No puedes desactivar tu propia cuenta" });
  }

  const employee = await EmployeeModel.updateEmployee(
    Number(req.params.id),
    { roleId, name, restDays, phone, email, status },
    req.user?.sub ?? null,
  );

  if (!employee) {
    return res.status(404).json({ ok: false, message: "Empleado no encontrado" });
  }

  return res.json({ ok: true, message: "Empleado actualizado", employee });
};

export const deleteEmployee = async (req, res) => {
  // DELETE siempre da de baja (status = false); impedir la auto-desactivación.
  if (Number(req.params.id) === req.user?.employeeId) {
    return res.status(400).json({ ok: false, message: "No puedes desactivar tu propia cuenta" });
  }

  const employee = await EmployeeModel.deleteEmployee(Number(req.params.id), req.user?.sub ?? null);

  if (!employee) {
    return res.status(404).json({ ok: false, message: "Empleado no encontrado" });
  }

  return res.json({ ok: true, message: "Empleado dado de baja", employee });
};

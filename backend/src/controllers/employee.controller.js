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

// Builds the temporary password the admin hands over to a new employee:
// first 2 letters of the name + first 2 letters of the email + last 4 phone
// digits, all lowercase (e.g. "Mauricio" / "mauricio@gmail.com" / "271-230-4713"
// -> "mama4713"). The employee is forced to change it on first login.
const generateTempPassword = (name, email, phone) => {
  const namePart = String(name).trim().slice(0, 2);
  const emailPart = String(email).trim().slice(0, 2);
  const phonePart = String(phone).replace(/\D/g, "").slice(-4);
  return `${namePart}${emailPart}${phonePart}`.toLowerCase();
};

export const newEmployee = async (req, res) => {
  const { roleId, name, restDays, phone, email } = req.body;

  if (!roleId || !name || !email || !phone) {
    return res
      .status(400)
      .json({ ok: false, message: "roleId, name, email y phone son obligatorios" });
  }

  const createdBy = req.user?.sub ?? null;

  // The employee row and its login user are always created together. The login
  // password is auto-generated (temporary) and returned once so the admin can
  // share it; the employee must change it on first login.
  const tempPassword = generateTempPassword(name, email, phone);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: empRows } = await client.query(
      "CALL sp_employee_create($1, $2, $3, $4, $5, $6, NULL)",
      [createdBy, roleId, name, restDays ?? null, phone ?? null, email],
    );
    const newEmployeeId = empRows[0].new_id;

    const hash = await bcrypt.hash(tempPassword, 10);
    await client.query("CALL sp_user_create($1, $2, $3, $4)", [
      newEmployeeId,
      email,
      hash,
      createdBy,
    ]);

    await client.query("COMMIT");

    const employee = await EmployeeModel.getEmployee(newEmployeeId);

    return res
      .status(201)
      .json({ ok: true, message: "Empleado registrado", employee, tempPassword });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateEmployee = async (req, res) => {
  const { roleId, name, restDays, phone, email, status } = req.body;
  const isSelf = Number(req.params.id) === req.user?.employeeId;

  // Un admin no puede desactivar su propia cuenta (sí puede editar sus datos).
  if (status === false && isSelf) {
    return res.status(400).json({ ok: false, message: "No puedes desactivar tu propia cuenta" });
  }

  // Tampoco puede cambiarse su propio rol (evita que se autodegrade y pierda
  // acceso admin, o se autopromueva).
  if (isSelf && roleId != null) {
    const current = await EmployeeModel.getEmployee(Number(req.params.id));
    if (current && Number(roleId) !== current.role_id) {
      return res.status(400).json({ ok: false, message: "No puedes cambiar tu propio rol" });
    }
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

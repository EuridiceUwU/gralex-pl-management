import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import * as AuthModel from "../models/auth.model.js";
import { jwtConfig } from "../config/jwt.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Email y contraseña son obligatorios" });
  }

  const user = await AuthModel.findUserByEmail(email);

  // Se rechaza si el usuario está deshabilitado (user.status) o si el empleado
  // asociado fue desactivado (employee_status); ambos bloquean el acceso.
  if (!user || !user.status || !user.employee_status) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    {
      sub: user.user_id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role_name,
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn },
  );

  return res.json({
    ok: true,
    token,
    user: {
      user_id: user.user_id,
      employee_id: user.employee_id,
      email: user.email,
      name: user.name,
      role: user.role_name,
      must_change_password: user.must_change_password,
    },
  });
};

export const changePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6 || newPassword.length > 72) {
    return res
      .status(400)
      .json({ ok: false, message: "La nueva contraseña debe tener entre 6 y 72 caracteres" });
  }

  const userId = req.user.sub;
  const hash = await bcrypt.hash(newPassword, 10);
  await AuthModel.updatePassword(userId, hash, userId);

  return res.json({ ok: true, message: "Contraseña actualizada" });
};

export const me = async (req, res) => {
  const user = await AuthModel.findUserById(req.user.sub);

  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }

  return res.json({ ok: true, user });
};

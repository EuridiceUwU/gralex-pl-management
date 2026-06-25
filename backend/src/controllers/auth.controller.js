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

  if (!user || !user.status) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { sub: user.user_id, email: user.email, role: user.role_name },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn },
  );

  return res.json({
    ok: true,
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role_name,
    },
  });
};

export const me = async (req, res) => {
  const user = await AuthModel.findUserById(req.user.sub);

  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }

  return res.json({ ok: true, user });
};

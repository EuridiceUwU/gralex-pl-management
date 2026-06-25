import jwt from "jsonwebtoken";

import { jwtConfig } from "../config/jwt.js";

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the decoded
 * payload to `req.user`. Rejects with 401 when the token is missing or invalid.
 */
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, message: "Token no proporcionado" });
  }

  try {
    req.user = jwt.verify(token, jwtConfig.secret);
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
};

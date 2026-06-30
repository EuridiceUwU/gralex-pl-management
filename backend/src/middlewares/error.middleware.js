/**
 * Centralized error handler. Express 5 forwards rejected async handlers here
 * automatically, so controllers can simply `throw`.
 */
export const errorHandler = (err, _req, res, _next) => {
  console.error("[gralex-backend] unhandled error", err);

  const status = err.status ?? 500;

  res.status(status).json({
    ok: false,
    message: err.message ?? "Error interno del servidor",
  });
};

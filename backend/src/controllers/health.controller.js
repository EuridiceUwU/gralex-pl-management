export const health = (_req, res) => {
  res.json({
    status: "ok",
    service: "gralex-backend",
    uptime: process.uptime(),
  });
};

export const root = (_req, res) => {
  res.json({
    service: "gralex-backend",
    version: "0.1.0",
  });
};

import * as DashboardModel from "../models/dashboard.model.js";

export const metrics = async (_req, res) => {
  const [summary, bySupplier, byStatus] = await Promise.all([
    DashboardModel.getMetrics(),
    DashboardModel.getBySupplier(),
    DashboardModel.getByStatus(),
  ]);

  return res.json({ ok: true, summary, bySupplier, byStatus });
};

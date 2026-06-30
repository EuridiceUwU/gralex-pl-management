import * as SupplierModel from "../models/supplier.model.js";

export const list = async (_req, res) => {
  const suppliers = await SupplierModel.listSuppliers();
  return res.json({ ok: true, suppliers });
};

export const get = async (req, res) => {
  const supplier = await SupplierModel.getSupplier(Number(req.params.id));

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, supplier });
};

export const create = async (req, res) => {
  const { name, creditAmount, rfc, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, message: "name es obligatorio" });
  }

  const supplier = await SupplierModel.createSupplier({
    createdBy: req.user?.sub ?? null,
    name,
    creditAmount: creditAmount ?? null,
    rfc: rfc ?? null,
    phone: phone ?? null,
    email: email ?? null,
  });

  return res.status(201).json({ ok: true, message: "Proveedor creado", supplier });
};

export const update = async (req, res) => {
  const { name, creditAmount, rfc, phone, email, status } = req.body;

  const supplier = await SupplierModel.updateSupplier(
    Number(req.params.id),
    { name, creditAmount, rfc, phone, email, status },
    req.user?.sub ?? null,
  );

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, message: "Proveedor actualizado", supplier });
};

export const remove = async (req, res) => {
  const supplier = await SupplierModel.deleteSupplier(Number(req.params.id), req.user?.sub ?? null);

  if (!supplier) {
    return res.status(404).json({ ok: false, message: "Proveedor no encontrado" });
  }

  return res.json({ ok: true, message: "Proveedor dado de baja", supplier });
};

export const listShipments = async (req, res) => {
  const shipments = await SupplierModel.listShipmentsBySupplier(Number(req.params.id));
  return res.json({ ok: true, shipments });
};

import * as CustomerModel from "../models/customer.model.js";

export const list = async (_req, res) => {
  const customers = await CustomerModel.listCustomers();
  return res.json({ ok: true, customers });
};

export const get = async (req, res) => {
  const customer = await CustomerModel.getCustomer(Number(req.params.id));

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, customer });
};

export const create = async (req, res) => {
  const { name, companyName, cp, rfc, phone, email, cfdi, constancyDocumentId } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, message: "name es obligatorio" });
  }

  const customer = await CustomerModel.createCustomer({
    createdBy: req.user?.sub ?? null,
    constancyDocumentId: constancyDocumentId ?? null,
    name,
    companyName: companyName ?? null,
    cp: cp ?? null,
    rfc: rfc ?? null,
    phone: phone ?? null,
    email: email ?? null,
    cfdi: cfdi ?? null,
  });

  return res.status(201).json({ ok: true, message: "Cliente creado", customer });
};

export const update = async (req, res) => {
  const { name, companyName, cp, rfc, phone, email, cfdi, status } = req.body;

  const customer = await CustomerModel.updateCustomer(
    Number(req.params.id),
    { name, companyName, cp, rfc, phone, email, cfdi, status },
    req.user?.sub ?? null,
  );

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, message: "Cliente actualizado", customer });
};

export const remove = async (req, res) => {
  const customer = await CustomerModel.deleteCustomer(Number(req.params.id), req.user?.sub ?? null);

  if (!customer) {
    return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
  }

  return res.json({ ok: true, message: "Cliente dado de baja", customer });
};

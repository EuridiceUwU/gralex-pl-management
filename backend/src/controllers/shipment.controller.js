import * as ShipmentModel from "../models/shipment.model.js";

export const list = async (_req, res) => {
  const shipments = await ShipmentModel.listShipments();
  return res.json({ ok: true, shipments });
};

export const statuses = async (_req, res) => {
  const statuses = await ShipmentModel.listStatuses();
  return res.json({ ok: true, statuses });
};

export const get = async (req, res) => {
  const shipment = await ShipmentModel.getShipment(Number(req.params.id));

  if (!shipment) {
    return res.status(404).json({ ok: false, message: "Guía no encontrada" });
  }

  return res.json({ ok: true, shipment });
};

export const create = async (req, res) => {
  const {
    ssId,
    supplierId,
    customerId,
    minioId,
    trackingNum,
    senderName,
    receiverName,
    senderCp,
    receiverCp,
    weight,
    service,
    creationDate,
    cost,
    price,
  } = req.body;

  if (!ssId || !trackingNum) {
    return res.status(400).json({
      ok: false,
      message: "ssId y trackingNum son obligatorios",
    });
  }

  const shipment = await ShipmentModel.createShipment({
    ssId,
    createdBy: req.user?.sub ?? null,
    supplierId,
    customerId,
    minioId: minioId ?? null,
    trackingNum,
    senderName: senderName ?? null,
    receiverName: receiverName ?? null,
    senderCp: senderCp ?? null,
    receiverCp: receiverCp ?? null,
    weight: weight ?? null,
    service: service ?? null,
    creationDate: creationDate ?? null,
    cost: cost ?? null,
    price: price ?? null,
  });

  return res.status(201).json({ ok: true, message: "Guía registrada", shipment });
};

export const removeSupplier = async (req, res) => {
  const shipment = await ShipmentModel.removeSupplier(
    Number(req.params.id),
    req.user?.sub ?? null,
  );

  if (!shipment) {
    return res.status(404).json({ ok: false, message: "Guía no encontrada" });
  }

  return res.json({ ok: true, message: "Proveedor removido de la guía", shipment });
};

export const updateStatus = async (req, res) => {
  const { ssId } = req.body;

  if (!ssId) {
    return res.status(400).json({ ok: false, message: "ssId es obligatorio" });
  }

  const shipment = await ShipmentModel.updateStatus(
    Number(req.params.id),
    ssId,
    req.user?.sub ?? null,
  );

  if (!shipment) {
    return res.status(404).json({ ok: false, message: "Guía no encontrada" });
  }

  return res.json({ ok: true, message: "Estado actualizado", shipment });
};

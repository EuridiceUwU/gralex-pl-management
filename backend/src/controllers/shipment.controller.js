import * as ShipmentModel from "../models/shipment.model.js";

const ALLOWED_CARRIERS = ["Fedex", "DHL", "Estafeta", "Paquetexpress", "Otro"];
const ALLOWED_SERVICES = ["Express", "Terrestre", "Internacional"];

// Returns an error message when carrier/service are present but not one of
// the allowed values, or null when the payload is valid.
const validateCarrierAndService = ({ carrier, service }) => {
  if (carrier && !ALLOWED_CARRIERS.includes(carrier)) {
    return `carrier debe ser uno de: ${ALLOWED_CARRIERS.join(", ")}`;
  }
  if (service && !ALLOWED_SERVICES.includes(service)) {
    return `service debe ser uno de: ${ALLOWED_SERVICES.join(", ")}`;
  }
  return null;
};

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
    carrier,
    carrierOther,
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

  const validationError = validateCarrierAndService({ carrier, service });
  if (validationError) {
    return res.status(400).json({ ok: false, message: validationError });
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
    carrier: carrier ?? null,
    carrierOther: carrierOther ?? null,
    service: service ?? null,
    creationDate: creationDate || null,
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

export const update = async (req, res) => {
  const {
    ssId,
    supplierId,
    customerId,
    trackingNum,
    senderName,
    receiverName,
    senderCp,
    receiverCp,
    weight,
    carrier,
    carrierOther,
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

  const validationError = validateCarrierAndService({ carrier, service });
  if (validationError) {
    return res.status(400).json({ ok: false, message: validationError });
  }

  const shipment = await ShipmentModel.updateShipment(
    Number(req.params.id),
    {
      ssId,
      supplierId: supplierId ?? null,
      customerId: customerId ?? null,
      trackingNum,
      senderName: senderName ?? null,
      receiverName: receiverName ?? null,
      senderCp: senderCp ?? null,
      receiverCp: receiverCp ?? null,
      weight: weight ?? null,
      carrier: carrier ?? null,
      carrierOther: carrierOther ?? null,
      service: service ?? null,
      creationDate: creationDate || null,
      cost: cost ?? null,
      price: price ?? null,
    },
    req.user?.sub ?? null,
  );

  if (!shipment) {
    return res.status(404).json({ ok: false, message: "Guía no encontrada" });
  }

  return res.json({ ok: true, message: "Guía actualizada", shipment });
};

export const assign = async (req, res) => {
  const { shipmentIds, customerId, supplierId } = req.body;

  if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    return res.status(400).json({ ok: false, message: "shipmentIds debe ser un arreglo no vacío" });
  }

  if (!customerId && !supplierId) {
    return res.status(400).json({
      ok: false,
      message: "Se requiere customerId o supplierId para asignar las guías",
    });
  }

  const shipments = await ShipmentModel.assignShipments(
    shipmentIds.map(Number),
    customerId ?? null,
    supplierId ?? null,
    req.user?.sub ?? null,
  );

  return res.json({ ok: true, message: "Guías asignadas", shipments });
};

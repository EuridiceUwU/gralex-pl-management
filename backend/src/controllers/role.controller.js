import * as RoleModel from "../models/role.model.js";

export const list = async (_req, res) => {
  const roles = await RoleModel.listRoles();
  return res.json({ ok: true, roles });
};

export const get = async (req, res) => {
  const role = await RoleModel.getRole(Number(req.params.id));

  if (!role) {
    return res.status(404).json({ ok: false, message: "Rol no encontrado" });
  }

  return res.json({ ok: true, role });
};

export const create = async (req, res) => {
  const { roleName, salary, description } = req.body;

  if (!roleName || salary === undefined) {
    return res.status(400).json({ ok: false, message: "roleName y salary son obligatorios" });
  }

  const role = await RoleModel.createRole({
    createdBy: req.user?.sub ?? null,
    roleName,
    salary,
    description: description ?? null,
  });

  return res.status(201).json({ ok: true, message: "Rol creado", role });
};

export const update = async (req, res) => {
  const { roleName, salary, description, status } = req.body;

  const role = await RoleModel.updateRole(
    Number(req.params.id),
    { roleName, salary, description, status },
    req.user?.sub ?? null,
  );

  if (!role) {
    return res.status(404).json({ ok: false, message: "Rol no encontrado" });
  }

  return res.json({ ok: true, message: "Rol actualizado", role });
};

export const remove = async (req, res) => {
  const role = await RoleModel.deleteRole(Number(req.params.id), req.user?.sub ?? null);

  if (!role) {
    return res.status(404).json({ ok: false, message: "Rol no encontrado" });
  }

  return res.json({ ok: true, message: "Rol dado de baja", role });
};

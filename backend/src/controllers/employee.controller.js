import * as EmployeeModel from "../models/employee.model.js";

export const newEmployee = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                ok: false,
                message: "Todos los campos son obligatorios"
            });
        }

        const result = await EmployeeModel.newEmployee(name, email, password, role);
        return res.status(201).json({
            ok: true,
            message: "Empleado registrado exitosamente",
            employee: result
        });

    } catch (error) {
        console.error("Error al registrar empleado", error);
        return res.status(500).json({
            ok: false,
            message: "Error al registrar empleado"
        });
    }
}

export const allEmployees = async (req, res) => {
    try {
        const result = await EmployeeModel.allEmployees();
        return res.status(201).json({
            ok: true,
            employees: result
        });
    } catch (error) {
        console.error("Error al consultar la lista de empleados", error);
        return res.status(500).json({
            ok: false,
            message: "Error al consultar la lista de empleados"
        });
    }
}
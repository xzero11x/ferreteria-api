import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as proveedorModel from '../models/proveedor.model';
import { CreateProveedorSchema, UpdateProveedorSchema } from '../dtos/proveedor.dto';
import { IdParamSchema } from '../dtos/common.dto';

/**
 * Obtiene todos los proveedores del tenant autenticado
 */
export const getProveedoresHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const proveedores = await proveedorModel.findAllProveedoresByTenant(tenantId);
    res.status(200).json(proveedores);
  }
);

/**
 * Crea un nuevo proveedor para el tenant autenticado
 */
export const createProveedorHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parse = CreateProveedorSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevo = await proveedorModel.createProveedor(parse.data, tenantId);
      res.status(201).json(nuevo);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El RUC/identidad ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear proveedor.' });
    }
  }
);

/**
 * Obtiene un proveedor específico por id
 */
export const getProveedorByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const proveedor = await proveedorModel.findProveedorByIdAndTenant(tenantId, parsedId.data.id);
    if (!proveedor) {
      res.status(404).json({ message: 'Proveedor no encontrado.' });
      return;
    }
    res.status(200).json(proveedor);
  }
);

/**
 * Actualiza un proveedor por id
 */
export const updateProveedorHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateProveedorSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }
    try {
      const updated = await proveedorModel.updateProveedorByIdAndTenant(
        tenantId,
        parsedId.data.id,
        parse.data
      );
      if (!updated) {
        res.status(404).json({ message: 'Proveedor no encontrado.' });
        return;
      }
      res.status(200).json(updated);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El RUC/identidad ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar proveedor.' });
    }
  }
);

/**
 * Desactiva un proveedor por id (borrado lógico)
 */
export const desactivarProveedorHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const deleted = await proveedorModel.desactivarProveedorByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Proveedor no encontrado.' });
      return;
    }
    res.status(200).json({ message: 'Proveedor desactivado.' });
  }
);
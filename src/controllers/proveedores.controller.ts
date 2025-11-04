import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as proveedorModel from '../models/proveedor.model';

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
    const data = req.body;

    if (!data.nombre) {
      res.status(400).json({ message: 'Nombre es requerido.' });
      return;
    }

    try {
      const nuevo = await proveedorModel.createProveedor(data, tenantId);
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
import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as clienteModel from '../models/cliente.model';

/**
 * Obtiene todos los clientes del tenant autenticado
 */
export const getClientesHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const clientes = await clienteModel.findAllClientesByTenant(tenantId);
    res.status(200).json(clientes);
  }
);

/**
 * Crea un nuevo cliente para el tenant autenticado
 */
export const createClienteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const data = req.body;

    if (!data.nombre) {
      res.status(400).json({ message: 'Nombre es requerido.' });
      return;
    }

    try {
      const nuevo = await clienteModel.createCliente(data, tenantId);
      res.status(201).json(nuevo);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El documento de identidad ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear cliente.' });
    }
  }
);
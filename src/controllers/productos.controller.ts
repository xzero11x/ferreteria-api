import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as productoModel from '../models/producto.model';

/**
 * Obtiene todos los productos del tenant autenticado
 */
export const getProductosHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const productos = await productoModel.findAllProductosByTenant(tenantId);
    res.status(200).json(productos);
  }
);

/**
 * Crea un nuevo producto para el tenant autenticado
 */
export const createProductoHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const data = req.body;

    if (!data.nombre || !data.precio_venta || !data.stock) {
      res.status(400).json({ message: 'Nombre, precio y stock son requeridos.' });
      return;
    }

    try {
      const nuevoProducto = await productoModel.createProducto(data, tenantId);
      res.status(201).json(nuevoProducto);
    } catch (error: any) {
      if (error?.code === 'TENANT_MISMATCH') {
        res.status(403).json({ message: 'La categoría no pertenece a este tenant.' });
        return;
      }
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'SKU ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear producto.' });
    }
  }
);
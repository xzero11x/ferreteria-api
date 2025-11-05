import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as productoModel from '../models/producto.model';
import { CreateProductoSchema, UpdateProductoSchema } from '../dtos/producto.dto';
import { IdParamSchema } from '../dtos/common.dto';

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
    const parse = CreateProductoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevoProducto = await productoModel.createProducto(parse.data, tenantId);
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

/**
 * Obtiene un producto específico por id
 */
export const getProductoByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const producto = await productoModel.findProductoByIdAndTenant(tenantId, parsedId.data.id);
    if (!producto) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }
    res.status(200).json(producto);
  }
);

/**
 * Actualiza un producto por id
 */
export const updateProductoHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateProductoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }
    try {
      const updated = await productoModel.updateProductoByIdAndTenant(
        tenantId,
        parsedId.data.id,
        parse.data
      );
      if (!updated) {
        res.status(404).json({ message: 'Producto no encontrado.' });
        return;
      }
      res.status(200).json(updated);
    } catch (error: any) {
      if (error?.code === 'TENANT_MISMATCH') {
        res.status(403).json({ message: 'La categoría no pertenece a este tenant.' });
        return;
      }
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'SKU ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar producto.' });
    }
  }
);

/**
 * Elimina un producto por id
 */
export const deleteProductoHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const deleted = await productoModel.deleteProductoByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }
    res.status(200).json({ message: 'Producto eliminado.' });
  }
);
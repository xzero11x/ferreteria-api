import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import { IdParamSchema } from '../dtos/common.dto';
import {
  CreateInventarioAjusteSchema,
  ListInventarioAjustesQuerySchema,
} from '../dtos/inventario.dto';
import * as inventarioModel from '../models/inventario.model';
import { TipoAjuste } from '@prisma/client';

/**
 * GET /api/inventario/ajustes — Lista todos los ajustes de inventario del tenant (con filtros opcionales)
 */
export const getInventarioAjustesHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parseQuery = ListInventarioAjustesQuerySchema.safeParse(req.query);
    if (!parseQuery.success) {
      res.status(400).json({ message: 'Query inválida', errors: parseQuery.error.flatten() });
      return;
    }

    const filters = {
      producto_id: parseQuery.data.producto_id,
      tipo: parseQuery.data.tipo as TipoAjuste | undefined,
      fecha_inicio: parseQuery.data.fecha_inicio ? new Date(parseQuery.data.fecha_inicio) : undefined,
      fecha_fin: parseQuery.data.fecha_fin ? new Date(parseQuery.data.fecha_fin) : undefined,
    };

    const ajustes = await inventarioModel.findAllInventarioAjustesByTenant(tenantId, filters);

    const result = ajustes.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      cantidad: a.cantidad,
      motivo: a.motivo,
      created_at: a.created_at,
      producto: a.producto
        ? {
            id: a.producto.id,
            nombre: a.producto.nombre,
            sku: a.producto.sku,
            stock_actual: a.producto.stock,
          }
        : null,
      usuario: a.usuario
        ? { id: a.usuario.id, nombre: a.usuario.nombre }
        : null,
    }));

    res.status(200).json(result);
  }
);

/**
 * GET /api/inventario/ajustes/:id — Obtiene el detalle de un ajuste específico
 */
export const getInventarioAjusteByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    const ajuste = await inventarioModel.findInventarioAjusteByIdAndTenant(
      tenantId,
      parsedId.data.id
    );
    if (!ajuste) {
      res.status(404).json({ message: 'Ajuste de inventario no encontrado.' });
      return;
    }

    res.status(200).json({
      id: ajuste.id,
      tipo: ajuste.tipo,
      cantidad: ajuste.cantidad,
      motivo: ajuste.motivo,
      created_at: ajuste.created_at,
      producto: ajuste.producto
        ? {
            id: ajuste.producto.id,
            nombre: ajuste.producto.nombre,
            sku: ajuste.producto.sku,
            stock_actual: ajuste.producto.stock,
          }
        : null,
      usuario: ajuste.usuario
        ? {
            id: ajuste.usuario.id,
            nombre: ajuste.usuario.nombre,
            email: ajuste.usuario.email,
          }
        : null,
    });
  }
);

/**
 * POST /api/inventario/ajustes — Crea un nuevo ajuste de inventario
 * Actualiza automáticamente el stock del producto
 */
export const createInventarioAjusteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const usuarioId = req.user?.id;
    const parse = CreateInventarioAjusteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevoAjuste = await inventarioModel.createInventarioAjuste(
        parse.data,
        tenantId,
        usuarioId
      );
      res.status(201).json({
        id: nuevoAjuste.id,
        tipo: nuevoAjuste.tipo,
        cantidad: nuevoAjuste.cantidad,
        motivo: nuevoAjuste.motivo,
        created_at: nuevoAjuste.created_at,
        producto_id: nuevoAjuste.producto_id,
      });
    } catch (error: any) {
      if (error?.code === 'PRODUCTO_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error?.code === 'STOCK_INSUFICIENTE') {
        res.status(409).json({ message: error.message });
        return;
      }
      console.error('Error al crear ajuste de inventario:', error);
      res.status(500).json({ message: 'Error al crear ajuste de inventario.' });
    }
  }
);

/**
 * DELETE /api/inventario/ajustes/:id — Elimina un ajuste de inventario
 * NOTA: No reversa automáticamente el stock. Usar con precaución.
 */
export const deleteInventarioAjusteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    const deleted = await inventarioModel.deleteInventarioAjusteByIdAndTenant(
      tenantId,
      parsedId.data.id
    );
    if (!deleted) {
      res.status(404).json({ message: 'Ajuste de inventario no encontrado.' });
      return;
    }

    res.status(200).json({
      message: 'Ajuste de inventario eliminado. NOTA: El stock NO fue reversado automáticamente.',
    });
  }
);

/**
 * GET /api/inventario/kardex/:productoId — Obtiene el historial de ajustes (Kardex) de un producto
 */
export const getKardexByProductoIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.productoId });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID de producto inválido', errors: parsedId.error.flatten() });
      return;
    }

    const kardex = await inventarioModel.findKardexByProductoIdAndTenant(
      tenantId,
      parsedId.data.id
    );
    if (!kardex) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }

    const ajustes = kardex.ajustes.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      cantidad: a.cantidad,
      motivo: a.motivo,
      created_at: a.created_at,
      usuario: a.usuario ? { id: a.usuario.id, nombre: a.usuario.nombre } : null,
    }));

    res.status(200).json({
      producto: {
        id: kardex.producto.id,
        nombre: kardex.producto.nombre,
        sku: kardex.producto.sku,
        stock_actual: kardex.producto.stock,
      },
      ajustes,
    });
  }
);

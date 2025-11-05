import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import { IdParamSchema } from '../dtos/common.dto';
import {
  CreateOrdenCompraSchema,
  UpdateOrdenCompraSchema,
  RecibirOrdenCompraSchema,
  ListOrdenesCompraQuerySchema,
} from '../dtos/orden-compra.dto';
import * as ordenCompraModel from '../models/orden-compra.model';
import { EstadoOrdenCompra } from '@prisma/client';

/**
 * GET /api/compras — Lista todas las órdenes de compra del tenant (con filtros opcionales)
 */
export const getOrdenesCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parseQuery = ListOrdenesCompraQuerySchema.safeParse(req.query);
    if (!parseQuery.success) {
      res.status(400).json({ message: 'Query inválida', errors: parseQuery.error.flatten() });
      return;
    }

    const filters = {
      proveedor_id: parseQuery.data.proveedor_id,
      estado: parseQuery.data.estado as EstadoOrdenCompra | undefined,
      fecha_inicio: parseQuery.data.fecha_inicio ? new Date(parseQuery.data.fecha_inicio) : undefined,
      fecha_fin: parseQuery.data.fecha_fin ? new Date(parseQuery.data.fecha_fin) : undefined,
    };

    const ordenes = await ordenCompraModel.findAllOrdenesCompraByTenant(tenantId, filters);

    const result = ordenes.map((o) => ({
      id: o.id,
      total: o.total,
      estado: o.estado,
      fecha_creacion: o.fecha_creacion,
      fecha_recepcion: o.fecha_recepcion,
      proveedor: o.proveedor
        ? {
            id: o.proveedor.id,
            nombre: o.proveedor.nombre,
            ruc_identidad: o.proveedor.ruc_identidad,
          }
        : null,
      usuario: o.usuario ? { id: o.usuario.id, nombre: o.usuario.nombre } : null,
    }));

    res.status(200).json(result);
  }
);

/**
 * GET /api/compras/:id — Obtiene el detalle de una orden de compra específica
 */
export const getOrdenCompraByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    const orden = await ordenCompraModel.findOrdenCompraByIdAndTenant(tenantId, parsedId.data.id);
    if (!orden) {
      res.status(404).json({ message: 'Orden de compra no encontrada.' });
      return;
    }

    const detalles = orden.OrdenCompraDetalles.map((d) => ({
      id: d.id,
      producto_id: d.producto_id,
      producto_nombre: d.producto?.nombre ?? null,
      producto_sku: d.producto?.sku ?? null,
      stock_actual: d.producto?.stock ?? 0,
      cantidad: d.cantidad,
      costo_unitario: d.costo_unitario,
      subtotal: Number(d.costo_unitario) * d.cantidad,
    }));

    res.status(200).json({
      id: orden.id,
      total: orden.total,
      estado: orden.estado,
      fecha_creacion: orden.fecha_creacion,
      fecha_recepcion: orden.fecha_recepcion,
      proveedor: orden.proveedor
        ? {
            id: orden.proveedor.id,
            nombre: orden.proveedor.nombre,
            ruc_identidad: orden.proveedor.ruc_identidad,
            email: orden.proveedor.email,
            telefono: orden.proveedor.telefono,
          }
        : null,
      usuario: orden.usuario
        ? { id: orden.usuario.id, nombre: orden.usuario.nombre }
        : null,
      detalles,
    });
  }
);

/**
 * POST /api/compras — Crea una nueva orden de compra
 */
export const createOrdenCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const usuarioId = req.user?.id;
    const parse = CreateOrdenCompraSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevaOrden = await ordenCompraModel.createOrdenCompra(parse.data, tenantId, usuarioId);
      res.status(201).json({
        id: nuevaOrden.id,
        total: nuevaOrden.total,
        estado: nuevaOrden.estado,
        fecha_creacion: nuevaOrden.fecha_creacion,
      });
    } catch (error: any) {
      if (error?.code === 'PRODUCTO_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error?.code === 'PROVEEDOR_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error('Error al crear orden de compra:', error);
      res.status(500).json({ message: 'Error al crear orden de compra.' });
    }
  }
);

/**
 * PUT /api/compras/:id — Actualiza una orden de compra existente
 */
export const updateOrdenCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateOrdenCompraSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const updated = await ordenCompraModel.updateOrdenCompraByIdAndTenant(
        tenantId,
        parsedId.data.id,
        parse.data
      );
      if (!updated) {
        res.status(404).json({ message: 'Orden de compra no encontrada.' });
        return;
      }

      res.status(200).json({
        id: updated.id,
        total: updated.total,
        estado: updated.estado,
        fecha_creacion: updated.fecha_creacion,
        fecha_recepcion: updated.fecha_recepcion,
      });
    } catch (error: any) {
      if (error?.code === 'PROVEEDOR_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error('Error al actualizar orden de compra:', error);
      res.status(500).json({ message: 'Error al actualizar orden de compra.' });
    }
  }
);

/**
 * POST /api/compras/:id/recibir — Registra la recepción de mercadería (actualiza stock)
 */
export const recibirOrdenCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = RecibirOrdenCompraSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const fechaRecepcion = parse.data.fecha_recepcion
        ? new Date(parse.data.fecha_recepcion)
        : undefined;

      const ordenRecibida = await ordenCompraModel.recibirOrdenCompra(
        tenantId,
        parsedId.data.id,
        fechaRecepcion
      );

      res.status(200).json({
        id: ordenRecibida.id,
        estado: ordenRecibida.estado,
        fecha_recepcion: ordenRecibida.fecha_recepcion,
        message: 'Orden recibida exitosamente. El stock de los productos ha sido actualizado.',
      });
    } catch (error: any) {
      if (error?.code === 'ORDEN_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error?.code === 'ESTADO_INVALIDO') {
        res.status(409).json({ message: error.message });
        return;
      }
      console.error('Error al recibir orden de compra:', error);
      res.status(500).json({ message: 'Error al recibir orden de compra.' });
    }
  }
);

/**
 * POST /api/compras/:id/cancelar — Cancela una orden de compra
 */
export const cancelarOrdenCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    try {
      const ordenCancelada = await ordenCompraModel.cancelarOrdenCompra(
        tenantId,
        parsedId.data.id
      );

      if (!ordenCancelada) {
        res.status(404).json({ message: 'Orden de compra no encontrada.' });
        return;
      }

      res.status(200).json({
        id: ordenCancelada.id,
        estado: ordenCancelada.estado,
        message: 'Orden cancelada exitosamente.',
      });
    } catch (error: any) {
      if (error?.code === 'ORDEN_YA_RECIBIDA') {
        res.status(409).json({ message: error.message });
        return;
      }
      console.error('Error al cancelar orden de compra:', error);
      res.status(500).json({ message: 'Error al cancelar orden de compra.' });
    }
  }
);

/**
 * DELETE /api/compras/:id — Elimina una orden de compra
 */
export const deleteOrdenCompraHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    try {
      const deleted = await ordenCompraModel.deleteOrdenCompraByIdAndTenant(
        tenantId,
        parsedId.data.id
      );
      if (!deleted) {
        res.status(404).json({ message: 'Orden de compra no encontrada.' });
        return;
      }

      res.status(200).json({ message: 'Orden de compra eliminada exitosamente.' });
    } catch (error: any) {
      if (error?.code === 'ORDEN_YA_RECIBIDA') {
        res.status(409).json({ message: error.message });
        return;
      }
      console.error('Error al eliminar orden de compra:', error);
      res.status(500).json({ message: 'Error al eliminar orden de compra.' });
    }
  }
);

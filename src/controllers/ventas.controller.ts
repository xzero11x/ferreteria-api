import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import { IdParamSchema } from '../dtos/common.dto';
import { CreateVentaSchema, ListVentasQuerySchema, UpdateVentaSchema } from '../dtos/venta.dto';
import * as ventaModel from '../models/venta.model';

/**
 * GET /api/ventas — Lista todas las ventas del tenant (con filtros opcionales)
 */
export const getVentasHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parseQuery = ListVentasQuerySchema.safeParse(req.query);
    if (!parseQuery.success) {
      res.status(400).json({ message: 'Query inválida', errors: parseQuery.error.flatten() });
      return;
    }

    const filters = {
      cliente_id: parseQuery.data.cliente_id,
      fecha_inicio: parseQuery.data.fecha_inicio ? new Date(parseQuery.data.fecha_inicio) : undefined,
      fecha_fin: parseQuery.data.fecha_fin ? new Date(parseQuery.data.fecha_fin) : undefined,
    };

    const ventas = await ventaModel.findAllVentasByTenant(tenantId, filters);

    const result = ventas.map((v) => ({
      id: v.id,
      total: v.total,
      metodo_pago: v.metodo_pago,
      created_at: v.created_at,
      cliente: v.cliente ? { id: v.cliente.id, nombre: v.cliente.nombre } : null,
      usuario: v.usuario ? { id: v.usuario.id, nombre: v.usuario.nombre } : null,
    }));

    res.status(200).json(result);
  }
);

/**
 * GET /api/ventas/:id — Obtiene el detalle de una venta específica
 */
export const getVentaByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    const venta = await ventaModel.findVentaByIdAndTenant(tenantId, parsedId.data.id);
    if (!venta) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    const detalles = venta.VentaDetalles.map((d) => ({
      id: d.id,
      producto_id: d.producto_id,
      producto_nombre: d.producto?.nombre ?? null,
      producto_sku: d.producto?.sku ?? null,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: Number(d.precio_unitario) * d.cantidad,
    }));

    res.status(200).json({
      id: venta.id,
      total: venta.total,
      metodo_pago: venta.metodo_pago,
      created_at: venta.created_at,
      cliente: venta.cliente
        ? {
            id: venta.cliente.id,
            nombre: venta.cliente.nombre,
            email: venta.cliente.email,
            telefono: venta.cliente.telefono,
          }
        : null,
      usuario: venta.usuario
        ? { id: venta.usuario.id, nombre: venta.usuario.nombre }
        : null,
      pedido_origen: venta.pedido_origen
        ? {
            id: venta.pedido_origen.id,
            estado: venta.pedido_origen.estado,
            tipo_recojo: venta.pedido_origen.tipo_recojo,
          }
        : null,
      detalles,
    });
  }
);

/**
 * POST /api/ventas — Crea una nueva venta (POS)
 * Valida stock y descuenta automáticamente
 */
export const createVentaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const usuarioId = req.user?.id;
    const parse = CreateVentaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevaVenta = await ventaModel.createVenta(parse.data, tenantId, usuarioId);
      res.status(201).json({
        id: nuevaVenta.id,
        total: nuevaVenta.total,
        metodo_pago: nuevaVenta.metodo_pago,
        created_at: nuevaVenta.created_at,
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
      console.error('Error al crear venta:', error);
      res.status(500).json({ message: 'Error al crear venta.' });
    }
  }
);

/**
 * PUT /api/ventas/:id — Actualiza método de pago de una venta
 * Nota: Uso limitado, generalmente las ventas no se editan
 */
export const updateVentaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateVentaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    const updated = await ventaModel.updateVentaByIdAndTenant(
      tenantId,
      parsedId.data.id,
      parse.data
    );
    if (!updated) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    res.status(200).json({
      id: updated.id,
      total: updated.total,
      metodo_pago: updated.metodo_pago,
      created_at: updated.created_at,
    });
  }
);

/**
 * DELETE /api/ventas/:id — Elimina una venta
 * Nota: Uso muy limitado, considerar soft delete en producción
 */
export const deleteVentaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    const deleted = await ventaModel.deleteVentaByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    res.status(200).json({ message: 'Venta eliminada exitosamente.' });
  }
);

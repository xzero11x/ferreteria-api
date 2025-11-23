import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import { IdParamSchema } from '../dtos/common.dto';
import { CreateVentaSchema, ListVentasQuerySchema, UpdateVentaSchema } from '../dtos/venta.dto';
import * as ventaModel from '../models/venta.model';
import * as auditService from '../services/audit.service';

/**
 * GET /api/ventas — Lista todas las ventas del tenant con paginación, búsqueda y filtros
 */
export const getVentasHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;

    // Parámetros de paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.q as string) || '';
    
    // Validar límites razonables
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * validLimit;

    // Filtros adicionales
    const filters = {
      skip,
      take: validLimit,
      search: search.trim() || undefined,
      cliente_id: req.query.cliente_id ? Number(req.query.cliente_id) : undefined,
      fecha_inicio: req.query.fecha_inicio ? new Date(req.query.fecha_inicio as string) : undefined,
      fecha_fin: req.query.fecha_fin ? new Date(req.query.fecha_fin as string) : undefined,
    };

    const { total, data: ventas } = await ventaModel.findVentasPaginadas(tenantId, filters);

    // Devolver objeto completo según VentaResponseSchema (incluye tenant_id, serie y detalles)
    const result = ventas.map((v) => ({
      id: v.id,
      total: v.total,
      metodo_pago: v.metodo_pago,
      created_at: v.created_at,
      tenant_id: v.tenant_id,
      cliente_id: v.cliente_id,
      cliente: v.cliente,
      usuario_id: v.usuario_id,
      usuario: v.usuario,
      pedido_origen_id: v.pedido_origen_id,
      sesion_caja_id: v.sesion_caja_id,
      serie_id: v.serie_id,
      serie: v.serie,
      numero_comprobante: v.numero_comprobante,
      detalles: v.VentaDetalles.map((d) => ({
        id: d.id,
        producto_id: d.producto_id,
        producto: d.producto,
        cantidad: d.cantidad,
        valor_unitario: d.valor_unitario,
        precio_unitario: d.precio_unitario,
        igv_total: d.igv_total,
        tasa_igv: d.tasa_igv,
        tenant_id: d.tenant_id,
        venta_id: d.venta_id,
      })),
    }));

    res.status(200).json({
      data: result,
      meta: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  }
);

/**
 * GET /api/ventas/:id — Obtiene el detalle de una venta específica
 */
export const getVentaByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const id = Number(req.params.id);

    const venta = await ventaModel.findVentaByIdAndTenant(tenantId, id);
    if (!venta) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    // Mapear detalles según DetalleVentaResponseSchema (incluye todos los campos fiscales)
    const detalles = venta.VentaDetalles.map((d) => ({
      id: d.id,
      producto_id: d.producto_id,
      producto: d.producto,
      cantidad: d.cantidad,
      valor_unitario: d.valor_unitario,
      precio_unitario: d.precio_unitario,
      igv_total: d.igv_total,
      tasa_igv: d.tasa_igv,
      tenant_id: d.tenant_id,
      venta_id: d.venta_id,
    }));

    // Devolver objeto completo según VentaResponseSchema
    res.status(200).json({
      id: venta.id,
      total: venta.total,
      metodo_pago: venta.metodo_pago,
      created_at: venta.created_at,
      tenant_id: venta.tenant_id,
      cliente_id: venta.cliente_id,
      cliente: venta.cliente,
      usuario_id: venta.usuario_id,
      usuario: venta.usuario,
      pedido_origen_id: venta.pedido_origen_id,
      sesion_caja_id: venta.sesion_caja_id,
      serie_id: venta.serie_id,
      numero_comprobante: venta.numero_comprobante,
      detalles,
    });
  }
);

/**
 * POST /api/ventas — Crea una nueva venta (POS)
 * Valida stock y descuenta automáticamente
 * Requiere sesión de caja activa (validado por middleware requireSesionCajaActiva)
 */
export const createVentaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const usuarioId = req.user?.id;
    const sesionCajaId = (req as any).sesionCajaId; // Proporcionado por middleware requireSesionCajaActiva

    try {
      const nuevaVenta = await ventaModel.createVenta(
        req.body,
        tenantId,
        sesionCajaId,
        usuarioId
      );
      if (usuarioId) {
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? undefined;
        const userAgent = req.get('user-agent') ?? undefined;
        // Registrar auditoría de forma asíncrona sin bloquear la respuesta
        void auditService.auditarCreacion(
          usuarioId,
          tenantId,
          'Ventas',
          nuevaVenta.id,
          {
            total: nuevaVenta.total,
            cliente_id: nuevaVenta.cliente_id,
            sesion_caja_id: nuevaVenta.sesion_caja_id,
            serie_id: nuevaVenta.serie_id,
            numero_comprobante: nuevaVenta.numero_comprobante,
          },
          ipAddress,
          userAgent
        );
      }
      // Devolver objeto completo según VentaResponseSchema
      res.status(201).json(nuevaVenta);
    } catch (error: any) {
      console.error('❌ Error al crear venta:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Body recibido:', JSON.stringify(req.body, null, 2));
      
      if (error?.code === 'PRODUCTO_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error?.code === 'STOCK_INSUFICIENTE') {
        res.status(409).json({ message: error.message });
        return;
      }
      if (error?.code === 'SERIE_NOT_FOUND') {
        res.status(404).json({ message: error.message });
        return;
      }
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
    const id = Number(req.params.id);

    const updated = await ventaModel.updateVentaByIdAndTenant(
      tenantId,
      id,
      req.body
    );
    if (!updated) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    // Devolver objeto completo según VentaResponseSchema
    res.status(200).json(updated);
  }
);

/**
 * DELETE /api/ventas/:id — Elimina una venta
 * Nota: Uso muy limitado, considerar soft delete en producción
 */
export const deleteVentaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const id = Number(req.params.id);

    const deleted = await ventaModel.deleteVentaByIdAndTenant(tenantId, id);
    if (!deleted) {
      res.status(404).json({ message: 'Venta no encontrada.' });
      return;
    }

    res.status(200).json({ message: 'Venta eliminada exitosamente.' });
  }
);

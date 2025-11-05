import { db } from '../config/db';
import { Prisma } from '@prisma/client';
import { type CreateVentaDTO } from '../dtos/venta.dto';

/**
 * Obtiene todas las ventas de un tenant con filtros opcionales
 */
export const findAllVentasByTenant = async (
  tenantId: number,
  filters?: {
    cliente_id?: number;
    fecha_inicio?: Date;
    fecha_fin?: Date;
  }
) => {
  return db.ventas.findMany({
    where: {
      tenant_id: tenantId,
      ...(filters?.cliente_id && { cliente_id: filters.cliente_id }),
      ...(filters?.fecha_inicio && {
        created_at: { gte: filters.fecha_inicio },
      }),
      ...(filters?.fecha_fin && {
        created_at: { lte: filters.fecha_fin },
      }),
    },
    orderBy: { created_at: 'desc' },
    include: {
      cliente: { select: { id: true, nombre: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });
};

/**
 * Busca una venta por ID validando pertenencia al tenant
 */
export const findVentaByIdAndTenant = async (tenantId: number, id: number) => {
  return db.ventas.findFirst({
    where: { id, tenant_id: tenantId },
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
      VentaDetalles: {
        include: {
          producto: { select: { id: true, nombre: true, sku: true } },
        },
      },
      pedido_origen: { select: { id: true, estado: true, tipo_recojo: true } },
    },
  });
};

/**
 * Crea una nueva venta con sus detalles (transacción)
 * Valida stock disponible y lo descuenta automáticamente
 */
export const createVenta = async (
  data: CreateVentaDTO,
  tenantId: number,
  usuarioId?: number,
  pedidoOrigenId?: number
) => {
  return db.$transaction(async (tx) => {
    // Calcular total
    let total = 0;
    for (const detalle of data.detalles) {
      total += Number(detalle.precio_unitario) * detalle.cantidad;
    }

    // Validar stock disponible para cada producto
    for (const detalle of data.detalles) {
      const producto = await tx.productos.findFirst({
        where: { id: detalle.producto_id, tenant_id: tenantId },
        select: { id: true, stock: true, nombre: true },
      });

      if (!producto) {
        const err = new Error(
          `Producto con ID ${detalle.producto_id} no encontrado en este tenant`
        );
        (err as any).code = 'PRODUCTO_NOT_FOUND';
        throw err;
      }

      if (producto.stock < detalle.cantidad) {
        const err = new Error(
          `Stock insuficiente para producto "${producto.nombre}". Disponible: ${producto.stock}, Requerido: ${detalle.cantidad}`
        );
        (err as any).code = 'STOCK_INSUFICIENTE';
        throw err;
      }
    }

    // Crear venta
    const nuevaVenta = await tx.ventas.create({
      data: {
        tenant_id: tenantId,
        total: total,
        metodo_pago: data.metodo_pago ?? null,
        cliente_id: data.cliente_id ?? null,
        usuario_id: usuarioId ?? null,
        pedido_origen_id: pedidoOrigenId ?? null,
      },
    });

    // Crear detalles de venta y descontar stock
    for (const detalle of data.detalles) {
      await tx.ventaDetalles.create({
        data: {
          tenant_id: tenantId,
          venta_id: nuevaVenta.id,
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
        },
      });

      // Descontar stock
      await tx.productos.update({
        where: { id: detalle.producto_id },
        data: {
          stock: {
            decrement: detalle.cantidad,
          },
        },
      });
    }

    return nuevaVenta;
  });
};

/**
 * Actualiza una venta existente (uso limitado)
 * Nota: Generalmente las ventas no se editan, solo se consultan
 */
export const updateVentaByIdAndTenant = async (
  tenantId: number,
  id: number,
  data: { metodo_pago?: string }
) => {
  const existing = await db.ventas.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  return db.ventas.update({
    where: { id },
    data: {
      metodo_pago: data.metodo_pago ?? existing.metodo_pago,
    },
  });
};

/**
 * Elimina una venta (uso muy limitado, considerar soft delete en producción)
 */
export const deleteVentaByIdAndTenant = async (tenantId: number, id: number) => {
  const existing = await db.ventas.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  // Eliminar en cascada los detalles (configurado en Prisma)
  return db.ventas.delete({ where: { id } });
};

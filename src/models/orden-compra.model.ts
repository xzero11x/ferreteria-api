import { db } from '../config/db';
import { EstadoOrdenCompra } from '@prisma/client';
import { type CreateOrdenCompraDTO, type UpdateOrdenCompraDTO } from '../dtos/orden-compra.dto';

/**
 * Obtiene todas las órdenes de compra de un tenant con filtros opcionales
 */
export const findAllOrdenesCompraByTenant = async (
  tenantId: number,
  filters?: {
    proveedor_id?: number;
    estado?: EstadoOrdenCompra;
    fecha_inicio?: Date;
    fecha_fin?: Date;
  }
) => {
  return db.ordenesCompra.findMany({
    where: {
      tenant_id: tenantId,
      ...(filters?.proveedor_id && { proveedor_id: filters.proveedor_id }),
      ...(filters?.estado && { estado: filters.estado }),
      ...(filters?.fecha_inicio && {
        fecha_creacion: { gte: filters.fecha_inicio },
      }),
      ...(filters?.fecha_fin && {
        fecha_creacion: { lte: filters.fecha_fin },
      }),
    },
    orderBy: { fecha_creacion: 'desc' },
    include: {
      proveedor: { select: { id: true, nombre: true, ruc_identidad: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });
};

/**
 * Busca una orden de compra por ID validando pertenencia al tenant
 */
export const findOrdenCompraByIdAndTenant = async (tenantId: number, id: number) => {
  return db.ordenesCompra.findFirst({
    where: { id, tenant_id: tenantId },
    include: {
      proveedor: { select: { id: true, nombre: true, ruc_identidad: true, email: true, telefono: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
      OrdenCompraDetalles: {
        include: {
          producto: { select: { id: true, nombre: true, sku: true, stock: true } },
        },
      },
    },
  });
};

/**
 * Crea una nueva orden de compra con sus detalles (transacción)
 */
export const createOrdenCompra = async (
  data: CreateOrdenCompraDTO,
  tenantId: number,
  usuarioId?: number
) => {
  return db.$transaction(async (tx) => {
    // Calcular total
    let total = 0;
    for (const detalle of data.detalles) {
      total += Number(detalle.costo_unitario) * detalle.cantidad;
    }

    // Validar que todos los productos pertenezcan al tenant
    for (const detalle of data.detalles) {
      const producto = await tx.productos.findFirst({
        where: { id: detalle.producto_id, tenant_id: tenantId },
        select: { id: true, nombre: true },
      });

      if (!producto) {
        const err = new Error(
          `Producto con ID ${detalle.producto_id} no encontrado en este tenant`
        );
        (err as any).code = 'PRODUCTO_NOT_FOUND';
        throw err;
      }
    }

    // Validar proveedor si se especifica
    if (data.proveedor_id) {
      const proveedor = await tx.proveedores.findFirst({
        where: { id: data.proveedor_id, tenant_id: tenantId },
        select: { id: true },
      });

      if (!proveedor) {
        const err = new Error(
          `Proveedor con ID ${data.proveedor_id} no encontrado en este tenant`
        );
        (err as any).code = 'PROVEEDOR_NOT_FOUND';
        throw err;
      }
    }

    // Crear orden de compra
    const nuevaOrden = await tx.ordenesCompra.create({
      data: {
        tenant_id: tenantId,
        total: total,
        estado: 'pendiente',
        proveedor_id: data.proveedor_id ?? null,
        usuario_id: usuarioId ?? null,
      },
    });

    // Crear detalles de orden de compra
    for (const detalle of data.detalles) {
      await tx.ordenCompraDetalles.create({
        data: {
          tenant_id: tenantId,
          orden_compra_id: nuevaOrden.id,
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
          costo_unitario: detalle.costo_unitario,
        },
      });
    }

    return nuevaOrden;
  });
};

/**
 * Actualiza una orden de compra existente
 */
export const updateOrdenCompraByIdAndTenant = async (
  tenantId: number,
  id: number,
  data: UpdateOrdenCompraDTO
) => {
  const existing = await db.ordenesCompra.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  // Validar proveedor si se intenta cambiar
  if (data.proveedor_id) {
    const proveedor = await db.proveedores.findFirst({
      where: { id: data.proveedor_id, tenant_id: tenantId },
      select: { id: true },
    });

    if (!proveedor) {
      const err = new Error(
        `Proveedor con ID ${data.proveedor_id} no encontrado en este tenant`
      );
      (err as any).code = 'PROVEEDOR_NOT_FOUND';
      throw err;
    }
  }

  return db.ordenesCompra.update({
    where: { id },
    data: {
      proveedor_id: data.proveedor_id ?? existing.proveedor_id,
      estado: data.estado ?? existing.estado,
    },
  });
};

/**
 * Registra la recepción de una orden de compra (cambia estado a 'recibida' e incrementa stock)
 */
export const recibirOrdenCompra = async (
  tenantId: number,
  id: number,
  fechaRecepcion?: Date
) => {
  return db.$transaction(async (tx) => {
    // Verificar que la orden existe y está pendiente
    const orden = await tx.ordenesCompra.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        OrdenCompraDetalles: {
          select: { producto_id: true, cantidad: true },
        },
      },
    });

    if (!orden) {
      const err = new Error('Orden de compra no encontrada');
      (err as any).code = 'ORDEN_NOT_FOUND';
      throw err;
    }

    if (orden.estado !== 'pendiente') {
      const err = new Error(
        `Solo se pueden recibir órdenes con estado "pendiente". Estado actual: ${orden.estado}`
      );
      (err as any).code = 'ESTADO_INVALIDO';
      throw err;
    }

    // Incrementar stock de cada producto
    for (const detalle of orden.OrdenCompraDetalles) {
      await tx.productos.update({
        where: { id: detalle.producto_id },
        data: {
          stock: {
            increment: detalle.cantidad,
          },
        },
      });
    }

    // Actualizar estado de la orden
    const ordenActualizada = await tx.ordenesCompra.update({
      where: { id },
      data: {
        estado: 'recibida',
        fecha_recepcion: fechaRecepcion ?? new Date(),
      },
    });

    return ordenActualizada;
  });
};

/**
 * Cancela una orden de compra (cambia estado a 'cancelada')
 */
export const cancelarOrdenCompra = async (tenantId: number, id: number) => {
  const existing = await db.ordenesCompra.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  if (existing.estado === 'recibida') {
    const err = new Error('No se puede cancelar una orden que ya fue recibida');
    (err as any).code = 'ORDEN_YA_RECIBIDA';
    throw err;
  }

  return db.ordenesCompra.update({
    where: { id },
    data: {
      estado: 'cancelada',
    },
  });
};

/**
 * Elimina una orden de compra (uso limitado)
 */
export const deleteOrdenCompraByIdAndTenant = async (tenantId: number, id: number) => {
  const existing = await db.ordenesCompra.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  if (existing.estado === 'recibida') {
    const err = new Error('No se puede eliminar una orden que ya fue recibida');
    (err as any).code = 'ORDEN_YA_RECIBIDA';
    throw err;
  }

  // Eliminar en cascada los detalles (configurado en Prisma)
  return db.ordenesCompra.delete({ where: { id } });
};

import { db } from '../config/db';
import { Prisma } from '@prisma/client';
import { type CreateVentaDTO } from '../dtos/venta.dto';
import * as tenantModel from './tenant.model';
import { calcularTasaIGV, descomponerPrecioConIGV, type AfectacionIGV } from '../utils/fiscal.utils';

/**
 * Obtiene ventas de un tenant con paginación, búsqueda y filtros (SERVER-SIDE)
 */
export const findVentasPaginadas = async (
  tenantId: number,
  params: {
    skip: number;
    take: number;
    search?: string;
    cliente_id?: number;
    fecha_inicio?: Date;
    fecha_fin?: Date;
  }
) => {
  const { skip, take, search, cliente_id, fecha_inicio, fecha_fin } = params;

  // Construir condición de búsqueda
  const whereClause: Prisma.VentasWhereInput = {
    tenant_id: tenantId,
    ...(cliente_id && { cliente_id }),
    ...(fecha_inicio && { created_at: { gte: fecha_inicio } }),
    ...(fecha_fin && { created_at: { lte: fecha_fin } }),
    ...(search && {
      OR: [
        { cliente: { nombre: { contains: search } } },
        { metodo_pago: { contains: search } },
      ],
    }),
  };

  // Ejecutar dos consultas en transacción
  const [total, data] = await db.$transaction([
    db.ventas.count({ where: whereClause }),
    db.ventas.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: {
        cliente: { 
          select: { 
            id: true, 
            nombre: true, 
            documento_identidad: true,
            direccion: true 
          } 
        },
        usuario: { select: { id: true, nombre: true, email: true } },
        serie: { 
          select: { 
            id: true, 
            codigo: true, 
            tipo_comprobante: true,
            correlativo_actual: true 
          } 
        },
        VentaDetalles: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                sku: true,
                unidad_medida: {
                  select: {
                    codigo: true,
                    nombre: true
                  }
                }
              }
            }
          }
        }
      },
    }),
  ]);

  return { total, data };
};

/**
 * Obtiene todas las ventas de un tenant con filtros opcionales
 * @deprecated Usar findVentasPaginadas para listas grandes
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
      serie: { select: { id: true, codigo: true, tipo_comprobante: true } },
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
 * Calcula y guarda snapshot fiscal (IGV) según jerarquía tenant → producto
 * Asigna automáticamente serie y correlativo según tipo de comprobante (FACTURA/BOLETA)
 */
export const createVenta = async (
  data: CreateVentaDTO,
  tenantId: number,
  sesionCajaId: number,
  usuarioId?: number,
  pedidoOrigenId?: number
) => {
  return db.$transaction(async (tx) => {
    // 1. Obtener la caja de la sesión actual
    const sesion = await tx.sesionesCaja.findFirst({
      where: { id: sesionCajaId, tenant_id: tenantId },
      select: { caja_id: true }
    });

    if (!sesion?.caja_id) {
      const err = new Error('Sesión de caja no tiene una caja asignada');
      (err as any).code = 'SESION_SIN_CAJA';
      throw err;
    }

    // 2. Determinar tipo de comprobante
    // Prioridad: 1) Manual (data.tipo_comprobante), 2) Auto-detección por RUC, 3) Default BOLETA
    let tipoComprobante: 'FACTURA' | 'BOLETA' = data.tipo_comprobante || 'BOLETA';
    
    if (!data.tipo_comprobante && data.cliente_id) {
      // Auto-detección: Primero revisar campo RUC, luego documento_identidad
      const cliente = await tx.clientes.findFirst({
        where: { id: data.cliente_id, tenant_id: tenantId },
        select: { ruc: true, documento_identidad: true }
      });
      
      if (cliente?.ruc) {
        // Si tiene RUC → FACTURA
        tipoComprobante = 'FACTURA';
      } else if (cliente?.documento_identidad?.length === 11) {
        // Fallback: Si documento_identidad es de 11 dígitos → FACTURA
        tipoComprobante = 'FACTURA';
      }
    }

    // 2.1. Validar: Si se requiere FACTURA, el cliente DEBE tener RUC
    if (tipoComprobante === 'FACTURA' && data.cliente_id) {
      const cliente = await tx.clientes.findFirst({
        where: { id: data.cliente_id, tenant_id: tenantId },
        select: { ruc: true, documento_identidad: true }
      });
      
      if (!cliente?.ruc && !cliente?.documento_identidad?.match(/^[0-9]{11}$/)) {
        const err = new Error(
          'Para emitir FACTURA, el cliente debe tener RUC registrado. Use BOLETA para clientes con DNI.'
        );
        (err as any).code = 'FACTURA_REQUIRES_RUC';
        throw err;
      }
    }

    // 3. Obtener serie activa para el tipo de comprobante y la caja específica
    const serie = await tx.series.findFirst({
      where: {
        tenant_id: tenantId,
        tipo_comprobante: tipoComprobante,
        caja_id: sesion.caja_id,  // ✅ FILTRAR POR CAJA
        isActive: true
      },
      orderBy: { id: 'asc' }  // Si hay múltiples, tomar la primera
    });

    if (!serie) {
      const err = new Error(
        `No existe una serie activa para comprobantes tipo ${tipoComprobante} asignada a esta caja. Por favor, configure las series en Administración → Series SUNAT.`
      );
      (err as any).code = 'SERIE_NOT_FOUND';
      throw err;
    }

    // 4. Incrementar correlativo de forma atómica
    const nuevoCorrelativo = serie.correlativo_actual + 1;
    await tx.series.update({
      where: { id: serie.id },
      data: { correlativo_actual: nuevoCorrelativo }
    });

    // 5. Obtener configuración tributaria del tenant
    const fiscalConfig = await tenantModel.getTenantFiscalConfig(tenantId);
    
    // 6. Calcular total y preparar detalles con snapshot fiscal
    let total = 0;
    const detallesConIGV: Array<{
      producto_id: number;
      cantidad: number;
      valor_unitario: number;
      precio_unitario: number;
      igv_total: number;
      tasa_igv: number;
    }> = [];

    // Validar stock y calcular IGV para cada detalle
    for (const detalle of data.detalles) {
      const producto = await tx.productos.findFirst({
        where: { id: detalle.producto_id, tenant_id: tenantId },
        select: { 
          id: true, 
          stock: true, 
          nombre: true, 
          afectacion_igv: true 
        },
      });

      if (!producto) {
        const err = new Error(
          `Producto con ID ${detalle.producto_id} no encontrado en este tenant`
        );
        (err as any).code = 'PRODUCTO_NOT_FOUND';
        throw err;
      }

      if (Number(producto.stock) < Number(detalle.cantidad)) {
        const err = new Error(
          `Stock insuficiente para producto "${producto.nombre}". Disponible: ${producto.stock}, Requerido: ${detalle.cantidad}`
        );
        (err as any).code = 'STOCK_INSUFICIENTE';
        throw err;
      }

      // Calcular tasa de IGV según jerarquía (tenant → producto)
      const tasaIGV = calcularTasaIGV(
        fiscalConfig,
        producto.afectacion_igv as AfectacionIGV
      );

      // Descomponer precio_unitario (con IGV) en valor_base + IGV
      const descomposicion = descomponerPrecioConIGV(
        Number(detalle.precio_unitario),
        tasaIGV
      );

      // IGV total de esta línea = IGV unitario × cantidad
      const igv_linea = descomposicion.igv * Number(detalle.cantidad);

      detallesConIGV.push({
        producto_id: detalle.producto_id,
        cantidad: Number(detalle.cantidad),
        valor_unitario: descomposicion.valor_base,
        precio_unitario: descomposicion.precio_final,
        igv_total: Number(igv_linea.toFixed(2)),
        tasa_igv: tasaIGV,
      });

      // Acumular total
      total += Number(detalle.precio_unitario) * Number(detalle.cantidad);
    }

    // 6. Crear venta con serie, correlativo y sesión de caja
    const nuevaVenta = await tx.ventas.create({
      data: {
        tenant_id: tenantId,
        total: Number(total.toFixed(2)),
        metodo_pago: data.metodo_pago ?? null,
        cliente_id: data.cliente_id ?? null,
        usuario_id: usuarioId ?? null,
        pedido_origen_id: pedidoOrigenId ?? null,
        sesion_caja_id: sesionCajaId,
        serie_id: serie.id,
        numero_comprobante: nuevoCorrelativo,
      },
    });

    // Crear detalles de venta CON snapshot fiscal y descontar stock
    for (const detalle of detallesConIGV) {
      await tx.ventaDetalles.create({
        data: {
          tenant_id: tenantId,
          venta_id: nuevaVenta.id,
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
          // Snapshot fiscal (inmutable)
          valor_unitario: detalle.valor_unitario,
          precio_unitario: detalle.precio_unitario,
          igv_total: detalle.igv_total,
          tasa_igv: detalle.tasa_igv,
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

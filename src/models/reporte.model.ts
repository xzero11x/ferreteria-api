import { db } from '../config/db';

/**
 * Genera el Kardex completo de un producto (Ventas + Compras + Ajustes)
 * Retorna todos los movimientos ordenados cronológicamente
 */
export const generarKardexCompleto = async (
  tenantId: number,
  productoId: number
) => {
  // Verificar que el producto existe
  const producto = await db.productos.findFirst({
    where: { id: productoId, tenant_id: tenantId, isActive: true },
    select: { id: true, nombre: true, sku: true, stock: true },
  });

  if (!producto) return null;

  // 1. Obtener ventas (salidas) - usamos la fecha de la venta padre
  const ventas = await db.ventaDetalles.findMany({
    where: {
      producto_id: productoId,
      tenant_id: tenantId,
    },
    select: {
      id: true,
      cantidad: true,
      precio_unitario: true,
      venta: {
        select: {
          id: true,
          created_at: true,
          cliente: {
            select: { nombre: true },
          },
        },
      },
    },
  });

  // 2. Obtener compras (entradas) - solo las recibidas
  const compras = await db.ordenCompraDetalles.findMany({
    where: {
      producto_id: productoId,
      tenant_id: tenantId,
      orden_compra: {
        estado: 'recibida', // Solo órdenes recibidas afectan el kardex
      },
    },
    select: {
      id: true,
      cantidad: true,
      costo_unitario: true,
      orden_compra: {
        select: {
          id: true,
          fecha_recepcion: true,
          proveedor: {
            select: { nombre: true },
          },
        },
      },
    },
  });

  // 3. Obtener ajustes manuales (entradas/salidas)
  const ajustes = await db.inventarioAjustes.findMany({
    where: {
      producto_id: productoId,
      tenant_id: tenantId,
    },
    select: {
      id: true,
      tipo: true,
      cantidad: true,
      motivo: true,
      created_at: true,
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  // 4. Unificar movimientos en un solo array con tipo discriminado
  type MovimientoKardex = {
    fecha: Date;
    tipo: 'venta' | 'compra' | 'ajuste_entrada' | 'ajuste_salida';
    cantidad: number;
    referencia: string;
    motivo?: string;
    responsable?: string;
    precio_unitario?: number;
  };

  const movimientos: MovimientoKardex[] = [];

  // Mapear ventas
  ventas.forEach((v) => {
    movimientos.push({
      fecha: v.venta.created_at,
      tipo: 'venta',
      cantidad: v.cantidad,
      referencia: `Venta #${v.venta.id} - ${v.venta.cliente?.nombre || 'Cliente desconocido'}`,
      precio_unitario: Number(v.precio_unitario),
    });
  });

  // Mapear compras
  compras.forEach((c) => {
    movimientos.push({
      fecha: c.orden_compra.fecha_recepcion || new Date(),
      tipo: 'compra',
      cantidad: c.cantidad,
      referencia: `Compra #${c.orden_compra.id} - ${c.orden_compra.proveedor?.nombre || 'Proveedor desconocido'}`,
      precio_unitario: Number(c.costo_unitario),
    });
  });

  // Mapear ajustes
  ajustes.forEach((a) => {
    movimientos.push({
      fecha: a.created_at,
      tipo: a.tipo === 'entrada' ? 'ajuste_entrada' : 'ajuste_salida',
      cantidad: a.cantidad,
      referencia: `Ajuste manual`,
      motivo: a.motivo || undefined,
      responsable: a.usuario?.nombre || a.usuario?.email || 'Usuario desconocido',
    });
  });

  // 5. Ordenar por fecha descendente (más reciente primero)
  movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  // 6. Calcular saldo acumulado (stock) en cada momento
  // Empezamos desde el stock actual y vamos hacia atrás
  let saldoActual = producto.stock;
  const movimientosConSaldo = movimientos.map((mov) => {
    const saldoAnterior = saldoActual;

    // Revertir el movimiento para obtener el saldo anterior
    if (mov.tipo === 'venta' || mov.tipo === 'ajuste_salida') {
      saldoActual += mov.cantidad; // Era mayor antes de la salida
    } else {
      saldoActual -= mov.cantidad; // Era menor antes de la entrada
    }

    return {
      ...mov,
      saldo: saldoAnterior,
    };
  });

  // Revertir para mostrar en orden cronológico ascendente (del más antiguo al más nuevo)
  const movimientosOrdenados = movimientosConSaldo.reverse();

  return {
    producto,
    stockActual: producto.stock,
    totalMovimientos: movimientos.length,
    movimientos: movimientosOrdenados,
  };
};

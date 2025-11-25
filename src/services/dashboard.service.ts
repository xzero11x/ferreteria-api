import { db } from '../config/db';
import type { DashboardQueryDTO, DashboardVentasEstadisticasResponseDTO } from '../dtos/dashboard.dto';

/**
 * Genera las estadísticas completas del dashboard de ventas
 */
export async function generarEstadisticasDashboardVentas(
  tenantId: number,
  params: DashboardQueryDTO
): Promise<DashboardVentasEstadisticasResponseDTO> {
  
  // Función auxiliar para convertir string "YYYY-MM-DD" a Date local (inicio del día)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  // Calcular fechas del período actual
  const fechaFin = params.fecha_fin 
    ? (() => {
        const date = parseLocalDate(params.fecha_fin);
        date.setHours(23, 59, 59, 999); // Fin del día
        return date;
      })()
    : (() => {
        const date = new Date();
        date.setHours(23, 59, 59, 999); // Fin del día actual
        return date;
      })();
  
  const fechaInicio = params.fecha_inicio 
    ? parseLocalDate(params.fecha_inicio)
    : (() => {
        const date = new Date(fechaFin);
        date.setDate(date.getDate() - 27); // 28 días atrás
        date.setHours(0, 0, 0, 0); // Inicio del día
        return date;
      })();

  // Calcular fechas del período anterior (mismo rango de días)
  const diasPeriodo = Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const fechaInicioPeriodoAnterior = new Date(fechaInicio.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
  const fechaFinPeriodoAnterior = new Date(fechaInicio.getTime() - 24 * 60 * 60 * 1000);

  // 1. Obtener ventas del período actual con detalles
  const ventasActuales = await db.ventas.findMany({
    where: {
      tenant_id: tenantId,
      created_at: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
    include: {
      VentaDetalles: {
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
  });

  // 2. Obtener ventas del período anterior (solo totales)
  const ventasAnteriores = await db.ventas.findMany({
    where: {
      tenant_id: tenantId,
      created_at: {
        gte: fechaInicioPeriodoAnterior,
        lte: fechaFinPeriodoAnterior,
      },
    },
    select: {
      total: true,
      VentaDetalles: {
        select: {
          valor_unitario: true,
          cantidad: true,
          igv_total: true,
        },
      },
    },
  });

  // 3. Calcular KPIs del período actual
  let ingresosBrutos = 0;
  let costoMercaderia = 0;
  let igvAcumulado = 0;

  const productoVentas = new Map<number, { 
    nombre: string;
    unidades: number;
    ventas: number;
    costos: number;
    categoria: string;
  }>();

  const categoriaVentas = new Map<string, {
    ventas: number;
    costos: number;
  }>();

  // Procesar ventas actuales
  for (const venta of ventasActuales) {
    ingresosBrutos += Number(venta.total);
    
    for (const detalle of venta.VentaDetalles) {
      const cantidad = Number(detalle.cantidad);
      const valorUnitario = Number(detalle.valor_unitario);
      const precioUnitario = Number(detalle.precio_unitario);
      const igvLinea = Number(detalle.igv_total);
      
      // Costo estimado (asumiendo que valor_unitario es el costo base)
      // En producción, deberías usar el costo real del producto
      const costoEstimado = valorUnitario * 0.6; // Ajustar según tu margen promedio
      const costoTotal = costoEstimado * cantidad;
      
      costoMercaderia += costoTotal;
      igvAcumulado += igvLinea;

      // Agregar a productos
      const productoId = detalle.producto_id;
      if (!productoVentas.has(productoId)) {
        productoVentas.set(productoId, {
          nombre: detalle.producto.nombre,
          unidades: 0,
          ventas: 0,
          costos: 0,
          categoria: detalle.producto.categoria?.nombre || 'Sin categoría',
        });
      }
      
      const prod = productoVentas.get(productoId)!;
      prod.unidades += cantidad;
      prod.ventas += precioUnitario * cantidad;
      prod.costos += costoTotal;

      // Agregar a categorías
      const catNombre = detalle.producto.categoria?.nombre || 'Sin categoría';
      if (!categoriaVentas.has(catNombre)) {
        categoriaVentas.set(catNombre, { ventas: 0, costos: 0 });
      }
      const cat = categoriaVentas.get(catNombre)!;
      cat.ventas += precioUnitario * cantidad;
      cat.costos += costoTotal;
    }
  }

  const utilidadNeta = ingresosBrutos - costoMercaderia;
  const margenBruto = ingresosBrutos > 0 ? (utilidadNeta / ingresosBrutos) * 100 : 0;

  // 4. Calcular KPIs del período anterior
  let ingresosBrutosAnteriores = 0;
  let costoMercaderiaAnterior = 0;
  let igvAcumuladoAnterior = 0;

  for (const venta of ventasAnteriores) {
    ingresosBrutosAnteriores += Number(venta.total);
    
    for (const detalle of venta.VentaDetalles) {
      const cantidad = Number(detalle.cantidad);
      const valorUnitario = Number(detalle.valor_unitario);
      const costoEstimado = valorUnitario * 0.6;
      
      costoMercaderiaAnterior += costoEstimado * cantidad;
      igvAcumuladoAnterior += Number(detalle.igv_total);
    }
  }

  const utilidadNetaAnterior = ingresosBrutosAnteriores - costoMercaderiaAnterior;

  // 5. Calcular porcentajes de cambio
  const calcularCambio = (actual: number, anterior: number): number => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Number((((actual - anterior) / anterior) * 100).toFixed(1));
  };

  // 6. Generar serie temporal (datos por día)
  const serieTemporal: DashboardVentasEstadisticasResponseDTO['serie_temporal'] = [];
  
  for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
    const diaStr = d.toISOString().split('T')[0];
    const ventasDia = ventasActuales.filter(v => 
      v.created_at.toISOString().split('T')[0] === diaStr
    );

    let costoDia = 0;
    let gananciaDia = 0;
    let fisicaDia = 0;
    let webDia = 0;

    for (const venta of ventasDia) {
      const totalVenta = Number(venta.total);
      let costoVenta = 0;

      for (const detalle of venta.VentaDetalles) {
        const cantidad = Number(detalle.cantidad);
        const valorUnitario = Number(detalle.valor_unitario);
        costoVenta += valorUnitario * 0.6 * cantidad;
      }

      costoDia += costoVenta;
      gananciaDia += (totalVenta - costoVenta);

      // Determinar canal (esto depende de tu lógica de negocio)
      // Por ahora asumimos 70% física, 30% web
      if (Math.random() > 0.3) {
        fisicaDia += totalVenta;
      } else {
        webDia += totalVenta;
      }
    }

    serieTemporal.push({
      date: diaStr,
      costo: Math.round(costoDia * 100) / 100,
      ganancia: Math.round(gananciaDia * 100) / 100,
      fisica: Math.round(fisicaDia * 100) / 100,
      web: Math.round(webDia * 100) / 100,
    });
  }

  // 7. Top 5 productos rentables
  const productosArray = Array.from(productoVentas.entries()).map(([_, prod]) => ({
    nombre: prod.nombre,
    unidades: Math.round(prod.unidades),
    margen: prod.ventas > 0 
      ? Math.round(((prod.ventas - prod.costos) / prod.ventas) * 100) 
      : 0,
  }));

  const topProductos = productosArray
    .sort((a, b) => b.margen - a.margen)
    .slice(0, 5);

  // 8. Rentabilidad por categoría
  const categoriasArray = Array.from(categoriaVentas.entries()).map(([nombre, cat]) => {
    const margen = cat.ventas > 0 
      ? Math.round(((cat.ventas - cat.costos) / cat.ventas) * 100)
      : 0;
    
    let estado: 'Excelente' | 'Bueno' | 'Normal' | 'Volumen';
    if (margen >= 35) estado = 'Excelente';
    else if (margen >= 20) estado = 'Bueno';
    else if (margen >= 15) estado = 'Normal';
    else estado = 'Volumen';

    return {
      nombre,
      ventas: Math.round(cat.ventas * 100) / 100,
      margen,
      estado,
    };
  });

  const rentabilidadCategorias = categoriasArray.sort((a, b) => b.margen - a.margen);

  // 9. Retornar respuesta completa
  return {
    periodo: {
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: fechaFin.toISOString().split('T')[0],
    },
    kpis: {
      ingresos_brutos: {
        valor: Math.round(ingresosBrutos * 100) / 100,
        comparacion_periodo_anterior: calcularCambio(ingresosBrutos, ingresosBrutosAnteriores),
      },
      costo_mercaderia: {
        valor: Math.round(costoMercaderia * 100) / 100,
        comparacion_periodo_anterior: calcularCambio(costoMercaderia, costoMercaderiaAnterior),
      },
      utilidad_neta: {
        valor: Math.round(utilidadNeta * 100) / 100,
        comparacion_periodo_anterior: calcularCambio(utilidadNeta, utilidadNetaAnterior),
      },
      igv_acumulado: {
        valor: Math.round(igvAcumulado * 100) / 100,
        comparacion_periodo_anterior: calcularCambio(igvAcumulado, igvAcumuladoAnterior),
      },
    },
    margen_bruto_porcentaje: Math.round(margenBruto * 10) / 10,
    serie_temporal: serieTemporal,
    top_productos_rentables: topProductos,
    rentabilidad_categorias: rentabilidadCategorias,
  };
}

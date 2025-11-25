/**
 * Script para sincronizar los correlativos de Series con las ventas existentes
 * 
 * Este script:
 * 1. Lee todas las series activas
 * 2. Para cada serie, busca el número de comprobante más alto en la tabla Ventas
 * 3. Actualiza correlativo_actual de la serie con ese número
 * 
 * Uso: npx ts-node scripts/fix-series-correlativos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSeriesCorrelativos() {
  console.log('🔧 Iniciando corrección de correlativos...\n');

  try {
    // Obtener todas las series activas
    const series = await prisma.series.findMany({
      where: { isActive: true },
      include: {
        tenant: { select: { nombre_empresa: true } }
      }
    });

    console.log(`📋 Se encontraron ${series.length} series activas\n`);

    for (const serie of series) {
      // Buscar el número de comprobante más alto para esta serie
      const ventaMaxima = await prisma.ventas.findFirst({
        where: {
          serie_id: serie.id,
          tenant_id: serie.tenant_id
        },
        orderBy: {
          numero_comprobante: 'desc'
        },
        select: {
          numero_comprobante: true
        }
      });

      const nuevoCorrelativo = ventaMaxima?.numero_comprobante || 0;

      console.log(`📊 Serie: ${serie.codigo} (${serie.tipo_comprobante})`);
      console.log(`   Tenant: ${serie.tenant.nombre_empresa}`);
      console.log(`   Correlativo actual en BD: ${serie.correlativo_actual}`);
      console.log(`   Último comprobante emitido: ${nuevoCorrelativo}`);

      if (nuevoCorrelativo > serie.correlativo_actual) {
        console.log(`   ✅ Actualizando correlativo a ${nuevoCorrelativo}`);
        
        await prisma.series.update({
          where: { id: serie.id },
          data: { correlativo_actual: nuevoCorrelativo }
        });
      } else {
        console.log(`   ℹ️  No requiere actualización`);
      }

      console.log('');
    }

    console.log('✅ Corrección completada exitosamente');

  } catch (error) {
    console.error('❌ Error al corregir correlativos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixSeriesCorrelativos()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

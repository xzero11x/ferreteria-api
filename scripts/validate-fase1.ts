import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateFase1() {
  console.log('\n🔍 VALIDACIÓN FASE 1: Compras Fiscales + IGV + Proveedores\n');

  try {
    // 1. Verificar esquema de Proveedores
    console.log('1️⃣  Verificando tabla Proveedores...');
    const proveedor = await prisma.$queryRaw<any[]>`
      SHOW COLUMNS FROM Proveedores WHERE Field IN ('tipo_documento', 'ruc_identidad')
    `;
    console.log('   Columnas encontradas:', proveedor.length);
    proveedor.forEach((col: any) => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(nullable)'} ${col.Default ? `default: ${col.Default}` : ''}`);
    });

    // 2. Verificar índice tipo_documento
    const proveedorIndex = await prisma.$queryRaw<any[]>`
      SHOW INDEX FROM Proveedores WHERE Key_name = 'Proveedores_tipo_documento_idx'
    `;
    console.log(`   ✅ Índice tipo_documento: ${proveedorIndex.length > 0 ? 'CREADO' : '❌ NO ENCONTRADO'}`);

    // 3. Verificar campos fiscales en OrdenesCompra
    console.log('\n2️⃣  Verificando tabla OrdenesCompra...');
    const ordenesColumns = await prisma.$queryRaw<any[]>`
      SHOW COLUMNS FROM OrdenesCompra 
      WHERE Field IN ('tipo_comprobante', 'serie', 'numero', 'fecha_emision', 
                      'fecha_contable', 'proveedor_ruc', 'subtotal_base', 'impuesto_igv')
    `;
    console.log('   Campos fiscales encontrados:', ordenesColumns.length, '/ 8');
    ordenesColumns.forEach((col: any) => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    // 4. Verificar constraint único
    const uniqueConstraint = await prisma.$queryRaw<any[]>`
      SHOW INDEX FROM OrdenesCompra 
      WHERE Key_name = 'OrdenesCompra_serie_numero_proveedor_ruc_tenant_id_key'
    `;
    console.log(`   ✅ Constraint único comprobantes: ${uniqueConstraint.length > 0 ? 'CREADO (' + uniqueConstraint.length + ' columnas)' : '❌ NO ENCONTRADO'}`);

    // 5. Verificar índices nuevos
    const ordenesIndexes = await prisma.$queryRaw<any[]>`
      SHOW INDEX FROM OrdenesCompra 
      WHERE Key_name IN ('OrdenesCompra_tipo_comprobante_idx', 'OrdenesCompra_fecha_emision_idx')
    `;
    console.log(`   ✅ Índices adicionales: ${ordenesIndexes.length} creados`);

    // 6. Verificar campos IGV en OrdenCompraDetalles
    console.log('\n3️⃣  Verificando tabla OrdenCompraDetalles...');
    const detallesColumns = await prisma.$queryRaw<any[]>`
      SHOW COLUMNS FROM OrdenCompraDetalles 
      WHERE Field IN ('costo_unitario_base', 'costo_unitario_total', 'tasa_igv', 'igv_linea')
    `;
    console.log('   Campos de desglose IGV:', detallesColumns.length, '/ 4');
    detallesColumns.forEach((col: any) => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Default ? `(default: ${col.Default})` : ''}`);
    });

    // 7. Resumen final
    console.log('\n📊 RESUMEN VALIDACIÓN:');
    const allChecks = [
      { name: 'Proveedores.tipo_documento', status: proveedor.some((c: any) => c.Field === 'tipo_documento') },
      { name: 'Proveedores.ruc_identidad NOT NULL', status: proveedor.some((c: any) => c.Field === 'ruc_identidad' && c.Null === 'NO') },
      { name: 'OrdenesCompra campos fiscales (8)', status: ordenesColumns.length === 8 },
      { name: 'OrdenesCompra constraint único', status: uniqueConstraint.length > 0 },
      { name: 'OrdenesCompra índices', status: ordenesIndexes.length >= 2 },
      { name: 'OrdenCompraDetalles campos IGV (4)', status: detallesColumns.length === 4 },
    ];

    allChecks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = allChecks.every(c => c.status);
    console.log(`\n${allPassed ? '✅ FASE 1 COMPLETADA EXITOSAMENTE' : '⚠️  ALGUNOS CHECKS FALLARON'}\n`);

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Error en validación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validateFase1();

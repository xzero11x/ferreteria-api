import { PrismaClient, TipoComprobante, TipoDocumento, EstadoOrdenCompra, EstadoPedido, TipoRecojo } from '@prisma/client';
import { fakerES as faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuración
const TENANT_NAME = 'Ferretería El Constructor';
const TENANT_DOMAIN = 'ferreteria-demo';
const PASSWORD_DEFAULT = '12345678'; // Para todos los usuarios

async function main() {
  console.log('🌱 Iniciando poblado de base de datos...');

  // 1. Limpiar base de datos (Orden inverso para respetar FKs)
  console.log('🧹 Limpiando datos antiguos...');
  await prisma.auditoriaLogs.deleteMany();
  await prisma.movimientosCaja.deleteMany();
  await prisma.ventaDetalles.deleteMany();
  await prisma.ventas.deleteMany();
  await prisma.pedidoDetalles.deleteMany();
  await prisma.pedidos.deleteMany();
  await prisma.ordenCompraDetalles.deleteMany();
  await prisma.ordenesCompra.deleteMany();
  await prisma.sesionesCaja.deleteMany();
  await prisma.series.deleteMany();
  await prisma.cajas.deleteMany();
  await prisma.inventarioAjustes.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.proveedores.deleteMany();
  await prisma.clientes.deleteMany();
  await prisma.marcas.deleteMany();
  await prisma.categorias.deleteMany();
  await prisma.unidadesMedida.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.tenants.deleteMany();

  // 2. Crear Tenant
  console.log('🏢 Creando Tenant...');
  const tenant = await prisma.tenants.create({
    data: {
      nombre_empresa: TENANT_NAME,
      subdominio: TENANT_DOMAIN,
      isActive: true,
      configuracion: {
        facturacion: {
          impuesto_nombre: 'IGV',
          tasa_impuesto: 18.00,
          es_agente_retencion: false,
          exonerado_regional: false
        }
      }
    }
  });

  // 3. Crear Usuarios
  console.log('bust Creando Usuarios...');
  const passwordHash = await bcrypt.hash(PASSWORD_DEFAULT, 10);
  
  const admin = await prisma.usuarios.create({
    data: {
      tenant_id: tenant.id,
      nombre: 'Admin General',
      email: `admin@${TENANT_DOMAIN}.com`,
      password_hash: passwordHash,
      rol: 'admin',
      isActive: true
    }
  });

  const vendedor = await prisma.usuarios.create({
    data: {
      tenant_id: tenant.id,
      nombre: 'Juan Cajero',
      email: `cajero@${TENANT_DOMAIN}.com`,
      password_hash: passwordHash,
      rol: 'empleado',
      isActive: true
    }
  });

  // 4. Maestros: Unidades, Categorías, Marcas
  console.log('📚 Creando Catálogos...');
  
  // Unidades SUNAT
  const unidadesData = [
    { codigo: 'NIU', nombre: 'UNIDAD', permite_decimales: false },
    { codigo: 'KGM', nombre: 'KILOGRAMO', permite_decimales: true },
    { codigo: 'MTR', nombre: 'METRO', permite_decimales: true },
    { codigo: 'LTR', nombre: 'LITRO', permite_decimales: true },
    { codigo: 'BX', nombre: 'CAJA', permite_decimales: false },
  ];
  
  for (const u of unidadesData) {
    await prisma.unidadesMedida.create({ data: { ...u, tenant_id: tenant.id } });
  }
  const unidades = await prisma.unidadesMedida.findMany({ where: { tenant_id: tenant.id } });

  // Categorías
  const categoriasNombres = ['Herramientas Eléctricas', 'Herramientas Manuales', 'Construcción', 'Pinturas', 'Gasfitería', 'Electricidad'];
  for (const nombre of categoriasNombres) {
    await prisma.categorias.create({ data: { nombre, tenant_id: tenant.id } });
  }
  const categorias = await prisma.categorias.findMany({ where: { tenant_id: tenant.id } });

  // Marcas
  const marcasNombres = ['Stanley', 'Bosch', 'Truper', '3M', 'Pavco', 'Indeco', 'Cimbor', 'Philips'];
  for (const nombre of marcasNombres) {
    await prisma.marcas.create({ data: { nombre, tenant_id: tenant.id } });
  }
  const marcas = await prisma.marcas.findMany({ where: { tenant_id: tenant.id } });

  // 5. Proveedores y Clientes
  console.log('🤝 Creando Socios de Negocio...');
  
  // Proveedores
  for (let i = 0; i < 5; i++) {
    await prisma.proveedores.create({
      data: {
        tenant_id: tenant.id,
        nombre: faker.company.name(),
        ruc_identidad: faker.string.numeric(11),
        tipo_documento: 'RUC',
        email: faker.internet.email(),
        direccion: faker.location.streetAddress()
      }
    });
  }
  const proveedores = await prisma.proveedores.findMany({ where: { tenant_id: tenant.id } });

  // Clientes
  for (let i = 0; i < 20; i++) {
    const esEmpresa = Math.random() > 0.7;
    await prisma.clientes.create({
      data: {
        tenant_id: tenant.id,
        nombre: faker.person.fullName(),
        documento_identidad: esEmpresa ? faker.string.numeric(11) : faker.string.numeric(8),
        ruc: esEmpresa ? faker.string.numeric(11) : null, // Algunos tienen ambos
        email: faker.internet.email(),
        direccion: faker.location.streetAddress()
      }
    });
  }
  const clientes = await prisma.clientes.findMany({ where: { tenant_id: tenant.id } });

  // 6. Productos
  console.log('🛠️ Creando Productos...');
  const productosCreados = [];
  
  for (let i = 0; i < 50; i++) {
    const categoria = faker.helpers.arrayElement(categorias);
    const marca = faker.helpers.arrayElement(marcas);
    const unidad = faker.helpers.arrayElement(unidades);
    
    const precioVenta = Number(faker.commerce.price({ min: 5, max: 500 }));
    const precioBase = Number((precioVenta / 1.18).toFixed(2)); // Cálculo inverso IGV

    const producto = await prisma.productos.create({
      data: {
        tenant_id: tenant.id,
        nombre: `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`,
        sku: faker.string.alphanumeric(8).toUpperCase(),
        descripcion: faker.commerce.productDescription(),
        precio_base: precioBase,
        afectacion_igv: 'GRAVADO',
        costo_compra: Number((precioBase * 0.7).toFixed(2)), // 30% margen aprox
        stock: 0, // Inicializamos en 0, las compras lo subirán
        stock_minimo: 5,
        unidad_medida_id: unidad.id,
        categoria_id: categoria.id,
        marca_id: marca.id
      }
    });
    productosCreados.push(producto);
  }

  // 7. Configuración de Caja y Series
  console.log('💰 Configurando Cajas y Series...');
  
  const cajaPrincipal = await prisma.cajas.create({
    data: { tenant_id: tenant.id, nombre: 'Caja Principal' }
  });

  // Series F001 y B001
  const serieFactura = await prisma.series.create({
    data: { tenant_id: tenant.id, caja_id: cajaPrincipal.id, codigo: 'F001', tipo_comprobante: 'FACTURA', correlativo_actual: 0 }
  });
  const serieBoleta = await prisma.series.create({
    data: { tenant_id: tenant.id, caja_id: cajaPrincipal.id, codigo: 'B001', tipo_comprobante: 'BOLETA', correlativo_actual: 0 }
  });

  // 8. SIMULACIÓN DE OPERACIONES (Últimos 30 días)
  console.log('⏳ Simulando 30 días de operaciones...');
  
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30);

  for (let d = 0; d <= 30; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + d);
    
    // 8.1 Compras (Reabastecimiento cada 5 días)
    if (d % 5 === 0) {
      const proveedor = faker.helpers.arrayElement(proveedores);
      const productosCompra = faker.helpers.arrayElements(productosCreados, 5);
      let totalCompra = 0;
      
      const orden = await prisma.ordenesCompra.create({
        data: {
          tenant_id: tenant.id,
          usuario_id: admin.id,
          proveedor_id: proveedor.id,
          estado: 'recibida', // Ya llegaron
          fecha_creacion: currentDate,
          fecha_recepcion: currentDate,
          // Datos fiscales simulados
          tipo_comprobante: 'FACTURA',
          serie: 'F' + faker.string.numeric(3),
          numero: faker.string.numeric(6),
          proveedor_ruc: proveedor.ruc_identidad,
          fecha_emision: currentDate,
          subtotal_base: 0, // Se actualizará luego
          impuesto_igv: 0,
          total: 0
        }
      });

      for (const prod of productosCompra) {
        const cantidad = faker.number.int({ min: 10, max: 50 });
        const costoTotal = Number(prod.costo_compra!) * 1.18;
        
        await prisma.ordenCompraDetalles.create({
          data: {
            tenant_id: tenant.id,
            orden_compra_id: orden.id,
            producto_id: prod.id,
            cantidad: cantidad,
            costo_unitario: costoTotal, // Legacy
            costo_unitario_base: prod.costo_compra,
            tasa_igv: 18.00,
            igv_linea: (Number(prod.costo_compra) * 0.18) * cantidad,
            costo_unitario_total: costoTotal
          }
        });

        // Actualizar stock físico
        await prisma.productos.update({
          where: { id: prod.id },
          data: { stock: { increment: cantidad } }
        });
        
        totalCompra += costoTotal * cantidad;
      }

      // Actualizar total orden
      await prisma.ordenesCompra.update({
        where: { id: orden.id },
        data: { 
          total: totalCompra,
          subtotal_base: totalCompra / 1.18,
          impuesto_igv: totalCompra - (totalCompra / 1.18)
        }
      });
    }

    // 8.2 Apertura de Caja (8:00 AM)
    const fechaApertura = new Date(currentDate);
    fechaApertura.setHours(8, 0, 0);
    
    const sesion = await prisma.sesionesCaja.create({
      data: {
        tenant_id: tenant.id,
        caja_id: cajaPrincipal.id,
        usuario_id: vendedor.id,
        fecha_apertura: fechaApertura,
        monto_inicial: 100.00,
        estado: 'CERRADA', // La creamos ya cerrada para el histórico
        fecha_cierre: new Date(fechaApertura.getTime() + 10 * 60 * 60 * 1000) // 10 horas después
      }
    });

    // 8.3 Ventas del día (5 a 15 ventas)
    const numVentas = faker.number.int({ min: 5, max: 15 });
    let totalVentasDia = 0;

    for (let v = 0; v < numVentas; v++) {
      const cliente = faker.helpers.arrayElement(clientes);
      const esFactura = cliente.ruc ? Math.random() > 0.5 : false;
      const serieUsar = esFactura ? serieFactura : serieBoleta;

      // Incrementar correlativo (simulado, lo hacemos directo en el objeto venta)
      // En producción esto se actualiza en la tabla Series
      
      const productosVenta = faker.helpers.arrayElements(productosCreados, faker.number.int({ min: 1, max: 4 }));
      let totalVenta = 0;
      let totalIGV = 0;
      
      // Crear Venta Cabecera
      const ventaFecha = new Date(fechaApertura);
      ventaFecha.setHours(faker.number.int({ min: 9, max: 17 }), faker.number.int({ min: 0, max: 59 }));

      const nuevaVenta = await prisma.ventas.create({
        data: {
          tenant_id: tenant.id,
          cliente_id: cliente.id,
          usuario_id: vendedor.id,
          sesion_caja_id: sesion.id,
          serie_id: serieUsar.id,
          numero_comprobante: v + 1 + (d * 20), // Correlativo fake creciente
          metodo_pago: faker.helpers.arrayElement(['EFECTIVO', 'YAPE', 'TARJETA']),
          total: 0, // update luego
          created_at: ventaFecha
        }
      });

      // Detalles Venta
      for (const prod of productosVenta) {
        const cantidad = faker.number.int({ min: 1, max: 5 });
        const precioUnitario = Number(prod.precio_base) * 1.18;
        const subtotal = precioUnitario * cantidad;
        const igvLinea = (subtotal / 1.18) * 0.18;

        await prisma.ventaDetalles.create({
          data: {
            tenant_id: tenant.id,
            venta_id: nuevaVenta.id,
            producto_id: prod.id,
            cantidad: cantidad,
            valor_unitario: prod.precio_base,
            precio_unitario: precioUnitario,
            tasa_igv: 18.00,
            igv_total: igvLinea
          }
        });
        
        // Descontar stock (puede quedar negativo en simulación, no importa)
        await prisma.productos.update({
          where: { id: prod.id },
          data: { stock: { decrement: cantidad } }
        });

        totalVenta += subtotal;
        totalIGV += igvLinea;
      }

      // Actualizar total venta
      await prisma.ventas.update({
        where: { id: nuevaVenta.id },
        data: { total: totalVenta }
      });

      totalVentasDia += totalVenta;
    }

    // 8.4 Movimiento de Caja (Gasto) - Ocasional
    let totalEgresos = 0;
    if (Math.random() > 0.7) {
      const montoGasto = faker.number.int({ min: 5, max: 20 });
      await prisma.movimientosCaja.create({
        data: {
          tenant_id: tenant.id,
          sesion_caja_id: sesion.id,
          tipo: 'EGRESO',
          monto: montoGasto,
          descripcion: faker.helpers.arrayElement(['Pago taxi', 'Compra limpieza', 'Almuerzo']),
          fecha: new Date(fechaApertura.getTime() + 4 * 60 * 60 * 1000)
        }
      });
      totalEgresos += montoGasto;
    }

    // 8.5 Actualizar cierre de sesión
    // Simulamos que cuadra perfecto o falla por poco
    const diferencia = Math.random() > 0.8 ? faker.number.float({ min: -5, max: 5, multipleOf: 0.1 }) : 0;
    const montoEsperado = 100 + totalVentasDia - totalEgresos;
    
    await prisma.sesionesCaja.update({
      where: { id: sesion.id },
      data: {
        monto_final: montoEsperado + diferencia,
        total_ventas: totalVentasDia,
        total_egresos: totalEgresos,
        diferencia: diferencia
      }
    });

    process.stdout.write('.'); // Progress bar visual
  }

  console.log('\n✅ Base de datos poblada exitosamente.');
  console.log(`   Tenant: ${TENANT_NAME}`);
  console.log(`   Admin: admin@${TENANT_DOMAIN}.com / ${PASSWORD_DEFAULT}`);
  console.log(`   Vendedor: cajero@${TENANT_DOMAIN}.com / ${PASSWORD_DEFAULT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
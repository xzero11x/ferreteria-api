-- =========================================
-- SCRIPT DE VALIDACIÓN FASE 1
-- Compras Fiscales + IGV + Proveedores
-- =========================================

-- 1. Verificar enum TipoDocumento en Proveedores
SHOW COLUMNS FROM Proveedores LIKE 'tipo_documento';

-- 2. Verificar que ruc_identidad es NOT NULL
SHOW COLUMNS FROM Proveedores LIKE 'ruc_identidad';

-- 3. Verificar nuevos campos fiscales en OrdenesCompra
SHOW COLUMNS FROM OrdenesCompra WHERE Field IN (
    'tipo_comprobante', 'serie', 'numero', 'fecha_emision', 
    'fecha_contable', 'proveedor_ruc', 'subtotal_base', 'impuesto_igv'
);

-- 4. Verificar constraint único para comprobantes
SHOW INDEX FROM OrdenesCompra WHERE Key_name = 'OrdenesCompra_serie_numero_proveedor_ruc_tenant_id_key';

-- 5. Verificar campos de desglose IGV en OrdenCompraDetalles
SHOW COLUMNS FROM OrdenCompraDetalles WHERE Field IN (
    'costo_unitario_base', 'costo_unitario_total', 'tasa_igv', 'igv_linea'
);

-- 6. Verificar índices nuevos
SHOW INDEX FROM OrdenesCompra WHERE Key_name IN ('OrdenesCompra_tipo_comprobante_idx', 'OrdenesCompra_fecha_emision_idx');
SHOW INDEX FROM Proveedores WHERE Key_name = 'Proveedores_tipo_documento_idx';

-- 7. Contar tablas afectadas
SELECT 'Proveedores' as tabla, COUNT(*) as registros FROM Proveedores
UNION ALL
SELECT 'OrdenesCompra', COUNT(*) FROM OrdenesCompra
UNION ALL
SELECT 'OrdenCompraDetalles', COUNT(*) FROM OrdenCompraDetalles;

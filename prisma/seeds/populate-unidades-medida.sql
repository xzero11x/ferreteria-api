-- ================================================================
-- SCRIPT DE POBLACIÓN INICIAL: UNIDADES DE MEDIDA (SUNAT)
-- ================================================================
-- Este script debe ejecutarse UNA VEZ después de aplicar la migración
-- que crea la tabla UnidadesMedida.
--
-- Propósito: Poblar unidades de medida según Catálogo 03 de SUNAT
-- Referencia: Tabla 6 - Unidades de Medida para Facturación Electrónica
-- Norma: Resolución de Superintendencia N° 097-2012/SUNAT
--
-- IMPORTANTE: Solo ejecutar si los tenants NO tienen unidades creadas
-- ================================================================

-- Verificar cuántos tenants hay
SELECT COUNT(*) as total_tenants FROM Tenants;

-- Verificar si ya hay unidades creadas (si hay, NO ejecutar este script)
SELECT COUNT(*) as total_unidades FROM UnidadesMedida;

-- ================================================================
-- INSERCIÓN MASIVA: Unidades SUNAT para TODOS los Tenants
-- ================================================================
-- Códigos según Catálogo 03 - Tabla 6 de SUNAT
-- Prioridad: Unidades más usadas en ferreterías y comercio minorista
-- ================================================================

INSERT INTO UnidadesMedida (codigo, nombre, permite_decimales, tenant_id)
-- === UNIDADES BÁSICAS (Más comunes) ===
SELECT 'NIU', 'UNIDAD (BIENES)', false, id FROM Tenants
UNION ALL
SELECT 'ZZ', 'UNIDAD (SERVICIOS)', false, id FROM Tenants
UNION ALL
-- === MASA/PESO ===
SELECT 'KGM', 'KILOGRAMO', true, id FROM Tenants
UNION ALL
SELECT 'GRM', 'GRAMO', true, id FROM Tenants
UNION ALL
SELECT 'TNE', 'TONELADA MÉTRICA', true, id FROM Tenants
UNION ALL
-- === LONGITUD ===
SELECT 'MTR', 'METRO', true, id FROM Tenants
UNION ALL
SELECT 'CMT', 'CENTÍMETRO', true, id FROM Tenants
UNION ALL
SELECT 'MMT', 'MILÍMETRO', true, id FROM Tenants
UNION ALL
SELECT 'KTM', 'KILÓMETRO', true, id FROM Tenants
UNION ALL
SELECT 'INH', 'PULGADA', true, id FROM Tenants
UNION ALL
SELECT 'FOT', 'PIE', true, id FROM Tenants
UNION ALL
-- === ÁREA ===
SELECT 'MTK', 'METRO CUADRADO', true, id FROM Tenants
UNION ALL
SELECT 'CMK', 'CENTÍMETRO CUADRADO', true, id FROM Tenants
UNION ALL
-- === VOLUMEN ===
SELECT 'MTQ', 'METRO CÚBICO', true, id FROM Tenants
UNION ALL
SELECT 'LTR', 'LITRO', true, id FROM Tenants
UNION ALL
SELECT 'MLT', 'MILILITRO', true, id FROM Tenants
UNION ALL
SELECT 'GLL', 'GALÓN', true, id FROM Tenants
UNION ALL
-- === EMBALAJE/AGRUPACIÓN ===
SELECT 'BX', 'CAJA', false, id FROM Tenants
UNION ALL
SELECT 'PK', 'PAQUETE', false, id FROM Tenants
UNION ALL
SELECT 'DZN', 'DOCENA', false, id FROM Tenants
UNION ALL
SELECT 'MIL', 'MILLAR', false, id FROM Tenants
UNION ALL
SELECT 'PF', 'PALLET', false, id FROM Tenants
UNION ALL
SELECT 'BG', 'BOLSA', false, id FROM Tenants
UNION ALL
-- === UNIDADES ESPECIALES FERRETERÍAS ===
SELECT 'SET', 'CONJUNTO/SET', false, id FROM Tenants
UNION ALL
SELECT 'PR', 'PAR', false, id FROM Tenants
UNION ALL
SELECT 'BLL', 'BARRIL', true, id FROM Tenants
UNION ALL
SELECT 'CAN', 'LATA/ENVASE', false, id FROM Tenants;

-- ================================================================
-- VERIFICACIÓN POST-INSERCIÓN
-- ================================================================

-- Verificar cuántas unidades se crearon por tenant
SELECT 
    t.nombre_empresa,
    COUNT(u.id) as total_unidades
FROM Tenants t
LEFT JOIN UnidadesMedida u ON u.tenant_id = t.id
GROUP BY t.id, t.nombre_empresa
ORDER BY t.nombre_empresa;

-- Listar todas las unidades creadas
SELECT 
    t.nombre_empresa,
    u.codigo,
    u.nombre,
    u.permite_decimales
FROM UnidadesMedida u
INNER JOIN Tenants t ON u.tenant_id = t.id
ORDER BY t.nombre_empresa, u.codigo;

-- ================================================================
-- SCRIPT ALTERNATIVO: Para UN solo tenant (manual)
-- ================================================================
-- Si necesitas agregar unidades a un tenant específico, usa este código:
/*
INSERT INTO UnidadesMedida (codigo, nombre, permite_decimales, tenant_id)
VALUES
    -- Unidades básicas (Reemplazar 1 con el ID del tenant)
    ('NIU', 'UNIDAD (BIENES)', false, 1),
    ('ZZ', 'UNIDAD (SERVICIOS)', false, 1),
    -- Masa
    ('KGM', 'KILOGRAMO', true, 1),
    ('GRM', 'GRAMO', true, 1),
    -- Longitud
    ('MTR', 'METRO', true, 1),
    ('CMT', 'CENTÍMETRO', true, 1),
    -- Volumen
    ('LTR', 'LITRO', true, 1),
    ('MLT', 'MILILITRO', true, 1),
    ('MTQ', 'METRO CÚBICO', true, 1),
    -- Área
    ('MTK', 'METRO CUADRADO', true, 1),
    -- Embalaje
    ('BX', 'CAJA', false, 1),
    ('PK', 'PAQUETE', false, 1),
    ('DZN', 'DOCENA', false, 1),
    ('MIL', 'MILLAR', false, 1);
*/

-- ================================================================
-- ACTUALIZACIÓN DE PRODUCTOS EXISTENTES (OPCIONAL)
-- ================================================================
-- Si hay productos sin unidad_medida_id asignada, asignar "Unidad" por defecto
/*
UPDATE Productos p
INNER JOIN UnidadesMedida u ON p.tenant_id = u.tenant_id AND u.codigo = 'NIU'
SET p.unidad_medida_id = u.id
WHERE p.unidad_medida_id IS NULL;
*/

-- ================================================================
-- NOTAS IMPORTANTES
-- ================================================================
-- 1. Ejecutar este script DESPUÉS de la migración que crea UnidadesMedida
-- 2. Verificar primero con los SELECTs si ya hay datos
-- 3. Cada tenant tendrá su propio conjunto de unidades (multi-tenant)
-- 4. Los códigos son OFICIALES de SUNAT (Catálogo 03 - Tabla 6)
-- 5. permite_decimales = true: Permite cantidades como 0.5, 1.25, etc.
-- 6. permite_decimales = false: Solo cantidades enteras (1, 2, 3, etc.)
-- 7. Referencia normativa: Resolución de Superintendencia N° 097-2012/SUNAT
-- 8. Catálogo completo: https://cpe.sunat.gob.pe/node/88

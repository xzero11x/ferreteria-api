-- AlterTable
ALTER TABLE `Ventas` ADD COLUMN `numero_comprobante` INTEGER NULL,
    ADD COLUMN `serie_id` INTEGER NULL,
    ADD COLUMN `sesion_caja_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `Cajas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `tenant_id` INTEGER NOT NULL,

    INDEX `Cajas_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Cajas_tenant_id_nombre_key`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SesionesCaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_apertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_cierre` DATETIME(3) NULL,
    `monto_inicial` DECIMAL(12, 2) NOT NULL,
    `monto_final` DECIMAL(12, 2) NULL,
    `total_ventas` DECIMAL(12, 2) NULL,
    `total_egresos` DECIMAL(12, 2) NULL,
    `diferencia` DECIMAL(12, 2) NULL,
    `estado` ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
    `tenant_id` INTEGER NOT NULL,
    `caja_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,

    INDEX `SesionesCaja_tenant_id_idx`(`tenant_id`),
    INDEX `SesionesCaja_caja_id_idx`(`caja_id`),
    INDEX `SesionesCaja_usuario_id_idx`(`usuario_id`),
    INDEX `SesionesCaja_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientosCaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('INGRESO', 'EGRESO') NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenant_id` INTEGER NOT NULL,
    `sesion_caja_id` INTEGER NOT NULL,

    INDEX `MovimientosCaja_tenant_id_idx`(`tenant_id`),
    INDEX `MovimientosCaja_sesion_caja_id_idx`(`sesion_caja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Series` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `tipo_comprobante` ENUM('FACTURA', 'BOLETA', 'NOTA_VENTA') NOT NULL,
    `correlativo_actual` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `tenant_id` INTEGER NOT NULL,
    `caja_id` INTEGER NULL,

    INDEX `Series_tenant_id_idx`(`tenant_id`),
    INDEX `Series_caja_id_idx`(`caja_id`),
    INDEX `Series_tipo_comprobante_idx`(`tipo_comprobante`),
    UNIQUE INDEX `Series_tenant_id_codigo_key`(`tenant_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Ventas_sesion_caja_id_idx` ON `Ventas`(`sesion_caja_id`);

-- CreateIndex
CREATE INDEX `Ventas_serie_id_idx` ON `Ventas`(`serie_id`);

-- CreateIndex
CREATE INDEX `Ventas_serie_id_numero_comprobante_idx` ON `Ventas`(`serie_id`, `numero_comprobante`);

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_sesion_caja_id_fkey` FOREIGN KEY (`sesion_caja_id`) REFERENCES `SesionesCaja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_serie_id_fkey` FOREIGN KEY (`serie_id`) REFERENCES `Series`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cajas` ADD CONSTRAINT `Cajas_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SesionesCaja` ADD CONSTRAINT `SesionesCaja_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SesionesCaja` ADD CONSTRAINT `SesionesCaja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `Cajas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SesionesCaja` ADD CONSTRAINT `SesionesCaja_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientosCaja` ADD CONSTRAINT `MovimientosCaja_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientosCaja` ADD CONSTRAINT `MovimientosCaja_sesion_caja_id_fkey` FOREIGN KEY (`sesion_caja_id`) REFERENCES `SesionesCaja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Series` ADD CONSTRAINT `Series_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Series` ADD CONSTRAINT `Series_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `Cajas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

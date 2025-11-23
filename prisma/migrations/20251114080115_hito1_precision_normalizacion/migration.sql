/*
  Warnings:

  - You are about to alter the column `cantidad` on the `InventarioAjustes` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,3)`.
  - You are about to alter the column `cantidad` on the `OrdenCompraDetalles` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,3)`.
  - You are about to alter the column `cantidad` on the `PedidoDetalles` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,3)`.
  - You are about to alter the column `stock` on the `Productos` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,3)`.
  - You are about to alter the column `cantidad` on the `VentaDetalles` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,3)`.
  - Added the required column `unidad_medida_id` to the `Productos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `InventarioAjustes` MODIFY `cantidad` DECIMAL(12, 3) NOT NULL;

-- AlterTable
ALTER TABLE `OrdenCompraDetalles` MODIFY `cantidad` DECIMAL(12, 3) NOT NULL;

-- AlterTable
ALTER TABLE `PedidoDetalles` MODIFY `cantidad` DECIMAL(12, 3) NOT NULL;

-- AlterTable
ALTER TABLE `Productos` ADD COLUMN `marca_id` INTEGER NULL,
    ADD COLUMN `unidad_medida_id` INTEGER NOT NULL,
    MODIFY `stock` DECIMAL(12, 3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `VentaDetalles` MODIFY `cantidad` DECIMAL(12, 3) NOT NULL;

-- CreateTable
CREATE TABLE `UnidadesMedida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `permite_decimales` BOOLEAN NOT NULL DEFAULT false,
    `tenant_id` INTEGER NOT NULL,

    INDEX `UnidadesMedida_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `UnidadesMedida_tenant_id_codigo_key`(`tenant_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Marcas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `tenant_id` INTEGER NOT NULL,

    INDEX `Marcas_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Marcas_tenant_id_nombre_key`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Productos_marca_id_idx` ON `Productos`(`marca_id`);

-- CreateIndex
CREATE INDEX `Productos_unidad_medida_id_idx` ON `Productos`(`unidad_medida_id`);

-- AddForeignKey
ALTER TABLE `UnidadesMedida` ADD CONSTRAINT `UnidadesMedida_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marcas` ADD CONSTRAINT `Marcas_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Productos` ADD CONSTRAINT `Productos_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `Marcas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Productos` ADD CONSTRAINT `Productos_unidad_medida_id_fkey` FOREIGN KEY (`unidad_medida_id`) REFERENCES `UnidadesMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[serie,numero,proveedor_ruc,tenant_id]` on the table `OrdenesCompra` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ruc_identidad` on table `Proveedores` required. This step will fail if there are existing NULL values in that column.

*/

-- AlterTable
ALTER TABLE `OrdenCompraDetalles` ADD COLUMN `costo_unitario_base` DECIMAL(12, 4) NULL,
    ADD COLUMN `costo_unitario_total` DECIMAL(12, 4) NULL,
    ADD COLUMN `igv_linea` DECIMAL(12, 2) NULL,
    ADD COLUMN `tasa_igv` DECIMAL(5, 2) NULL DEFAULT 18.00;

-- AlterTable
ALTER TABLE `OrdenesCompra` ADD COLUMN `fecha_contable` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `fecha_emision` DATETIME(3) NULL,
    ADD COLUMN `impuesto_igv` DECIMAL(12, 2) NULL,
    ADD COLUMN `numero` VARCHAR(191) NULL,
    ADD COLUMN `proveedor_ruc` VARCHAR(191) NULL,
    ADD COLUMN `serie` VARCHAR(191) NULL,
    ADD COLUMN `subtotal_base` DECIMAL(12, 2) NULL,
    ADD COLUMN `tipo_comprobante` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Proveedores` ADD COLUMN `tipo_documento` ENUM('RUC', 'DNI', 'CE') NOT NULL DEFAULT 'RUC',
    MODIFY `ruc_identidad` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `OrdenesCompra_tipo_comprobante_idx` ON `OrdenesCompra`(`tipo_comprobante`);

-- CreateIndex
CREATE INDEX `OrdenesCompra_fecha_emision_idx` ON `OrdenesCompra`(`fecha_emision`);

-- CreateIndex
CREATE UNIQUE INDEX `OrdenesCompra_serie_numero_proveedor_ruc_tenant_id_key` ON `OrdenesCompra`(`serie`, `numero`, `proveedor_ruc`, `tenant_id`);

-- CreateIndex
CREATE INDEX `Proveedores_tipo_documento_idx` ON `Proveedores`(`tipo_documento`);

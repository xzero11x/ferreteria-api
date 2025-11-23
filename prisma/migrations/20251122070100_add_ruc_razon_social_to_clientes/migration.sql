-- AlterTable: Agregar campos RUC y Razón Social a Clientes
ALTER TABLE `Clientes` ADD COLUMN `razon_social` VARCHAR(191) NULL,
    ADD COLUMN `ruc` VARCHAR(191) NULL;

-- CreateIndex: Índice para búsquedas por RUC
CREATE INDEX `Clientes_ruc_idx` ON `Clientes`(`ruc`);

/*
  Warnings:

  - You are about to drop the column `precio_venta` on the `Productos` table. All the data in the column will be lost.
  - You are about to alter the column `precio_unitario` on the `VentaDetalles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - Added the required column `precio_base` to the `Productos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `igv_total` to the `VentaDetalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tasa_igv` to the `VentaDetalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_unitario` to the `VentaDetalles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Productos` DROP COLUMN `precio_venta`,
    ADD COLUMN `afectacion_igv` ENUM('GRAVADO', 'EXONERADO', 'INAFECTO') NOT NULL DEFAULT 'GRAVADO',
    ADD COLUMN `precio_base` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `VentaDetalles` ADD COLUMN `igv_total` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `tasa_igv` DECIMAL(5, 2) NOT NULL,
    ADD COLUMN `valor_unitario` DECIMAL(12, 2) NOT NULL,
    MODIFY `precio_unitario` DECIMAL(12, 2) NOT NULL;

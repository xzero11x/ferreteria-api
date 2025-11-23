/*
  Warnings:

  - A unique constraint covering the columns `[serie_id,numero_comprobante,tenant_id]` on the table `Ventas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Ventas_serie_id_numero_comprobante_tenant_id_key` ON `Ventas`(`serie_id`, `numero_comprobante`, `tenant_id`);

/*
  Warnings:

  - A unique constraint covering the columns `[pedido_origen_id]` on the table `Ventas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Ventas` ADD COLUMN `pedido_origen_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `Pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('pendiente', 'confirmado', 'cancelado', 'entregado') NOT NULL DEFAULT 'pendiente',
    `tipo_recojo` ENUM('tienda', 'envio') NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `usuario_gestion_id` INTEGER NULL,

    INDEX `Pedidos_tenant_id_idx`(`tenant_id`),
    INDEX `Pedidos_cliente_id_idx`(`cliente_id`),
    INDEX `Pedidos_usuario_gestion_id_idx`(`usuario_gestion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PedidoDetalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `pedido_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,

    INDEX `PedidoDetalles_tenant_id_idx`(`tenant_id`),
    INDEX `PedidoDetalles_pedido_id_idx`(`pedido_id`),
    INDEX `PedidoDetalles_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Ventas_pedido_origen_id_key` ON `Ventas`(`pedido_origen_id`);

-- CreateIndex
CREATE INDEX `Ventas_pedido_origen_id_idx` ON `Ventas`(`pedido_origen_id`);

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_pedido_origen_id_fkey` FOREIGN KEY (`pedido_origen_id`) REFERENCES `Pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedidos` ADD CONSTRAINT `Pedidos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedidos` ADD CONSTRAINT `Pedidos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `Clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedidos` ADD CONSTRAINT `Pedidos_usuario_gestion_id_fkey` FOREIGN KEY (`usuario_gestion_id`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalles` ADD CONSTRAINT `PedidoDetalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalles` ADD CONSTRAINT `PedidoDetalles_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `Pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalles` ADD CONSTRAINT `PedidoDetalles_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

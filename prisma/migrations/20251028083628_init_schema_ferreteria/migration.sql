-- CreateTable
CREATE TABLE `Tenants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_empresa` VARCHAR(191) NOT NULL,
    `subdominio` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `configuracion` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Tenants_subdominio_key`(`subdominio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NULL,
    `rol` ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
    `tenant_id` INTEGER NOT NULL,

    INDEX `Usuarios_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Usuarios_tenant_id_email_key`(`tenant_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `tenant_id` INTEGER NOT NULL,

    INDEX `Categorias_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Categorias_tenant_id_nombre_key`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `descripcion` VARCHAR(191) NULL,
    `precio_venta` DECIMAL(65, 30) NOT NULL,
    `costo_compra` DECIMAL(65, 30) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stock_minimo` INTEGER NOT NULL DEFAULT 5,
    `tenant_id` INTEGER NOT NULL,
    `categoria_id` INTEGER NULL,

    INDEX `Productos_tenant_id_idx`(`tenant_id`),
    INDEX `Productos_categoria_id_idx`(`categoria_id`),
    UNIQUE INDEX `Productos_tenant_id_sku_key`(`tenant_id`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventarioAjustes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('entrada', 'salida') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenant_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NULL,

    INDEX `InventarioAjustes_tenant_id_idx`(`tenant_id`),
    INDEX `InventarioAjustes_producto_id_idx`(`producto_id`),
    INDEX `InventarioAjustes_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `ruc_identidad` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `tenant_id` INTEGER NOT NULL,

    INDEX `Proveedores_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Proveedores_tenant_id_ruc_identidad_key`(`tenant_id`, `ruc_identidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenesCompra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `total` DECIMAL(65, 30) NULL,
    `estado` ENUM('pendiente', 'recibida', 'cancelada') NOT NULL DEFAULT 'pendiente',
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_recepcion` DATETIME(3) NULL,
    `tenant_id` INTEGER NOT NULL,
    `proveedor_id` INTEGER NULL,
    `usuario_id` INTEGER NULL,

    INDEX `OrdenesCompra_tenant_id_idx`(`tenant_id`),
    INDEX `OrdenesCompra_proveedor_id_idx`(`proveedor_id`),
    INDEX `OrdenesCompra_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenCompraDetalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` INTEGER NOT NULL,
    `costo_unitario` DECIMAL(65, 30) NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `orden_compra_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,

    INDEX `OrdenCompraDetalles_tenant_id_idx`(`tenant_id`),
    INDEX `OrdenCompraDetalles_orden_compra_id_idx`(`orden_compra_id`),
    INDEX `OrdenCompraDetalles_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `documento_identidad` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `tenant_id` INTEGER NOT NULL,

    INDEX `Clientes_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `Clientes_tenant_id_documento_identidad_key`(`tenant_id`, `documento_identidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ventas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `total` DECIMAL(65, 30) NOT NULL,
    `metodo_pago` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenant_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `usuario_id` INTEGER NULL,

    INDEX `Ventas_tenant_id_idx`(`tenant_id`),
    INDEX `Ventas_cliente_id_idx`(`cliente_id`),
    INDEX `Ventas_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VentaDetalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(65, 30) NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `venta_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,

    INDEX `VentaDetalles_tenant_id_idx`(`tenant_id`),
    INDEX `VentaDetalles_venta_id_idx`(`venta_id`),
    INDEX `VentaDetalles_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Categorias` ADD CONSTRAINT `Categorias_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Productos` ADD CONSTRAINT `Productos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Productos` ADD CONSTRAINT `Productos_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `Categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventarioAjustes` ADD CONSTRAINT `InventarioAjustes_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventarioAjustes` ADD CONSTRAINT `InventarioAjustes_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventarioAjustes` ADD CONSTRAINT `InventarioAjustes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proveedores` ADD CONSTRAINT `Proveedores_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenesCompra` ADD CONSTRAINT `OrdenesCompra_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenesCompra` ADD CONSTRAINT `OrdenesCompra_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenesCompra` ADD CONSTRAINT `OrdenesCompra_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenCompraDetalles` ADD CONSTRAINT `OrdenCompraDetalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenCompraDetalles` ADD CONSTRAINT `OrdenCompraDetalles_orden_compra_id_fkey` FOREIGN KEY (`orden_compra_id`) REFERENCES `OrdenesCompra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenCompraDetalles` ADD CONSTRAINT `OrdenCompraDetalles_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clientes` ADD CONSTRAINT `Clientes_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `Clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ventas` ADD CONSTRAINT `Ventas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VentaDetalles` ADD CONSTRAINT `VentaDetalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VentaDetalles` ADD CONSTRAINT `VentaDetalles_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `Ventas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VentaDetalles` ADD CONSTRAINT `VentaDetalles_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

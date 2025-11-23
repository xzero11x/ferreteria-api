-- Migración Hito 4: Auditoría y Storage
-- Solo agrega lo nuevo sin tocar lo que ya existe

-- 1. Agregar columna imagen_url a Productos (si no existe)
ALTER TABLE `Productos` ADD COLUMN IF NOT EXISTS `imagen_url` VARCHAR(191) NULL;

-- 2. Crear tabla AuditoriaLogs (si no existe)
CREATE TABLE IF NOT EXISTS `AuditoriaLogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `accion` ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'ANULAR', 'AJUSTAR', 'LOGIN', 'LOGOUT') NOT NULL,
    `tabla_afectada` VARCHAR(191) NOT NULL,
    `registro_id` INTEGER NULL,
    `datos_antes` JSON NULL,
    `datos_despues` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenant_id` INTEGER NOT NULL,

    INDEX `AuditoriaLogs_tenant_id_idx`(`tenant_id`),
    INDEX `AuditoriaLogs_usuario_id_idx`(`usuario_id`),
    INDEX `AuditoriaLogs_accion_idx`(`accion`),
    INDEX `AuditoriaLogs_tabla_afectada_idx`(`tabla_afectada`),
    INDEX `AuditoriaLogs_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Agregar foreign keys de AuditoriaLogs
ALTER TABLE `AuditoriaLogs` 
ADD CONSTRAINT `AuditoriaLogs_usuario_id_fkey` 
FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuditoriaLogs` 
ADD CONSTRAINT `AuditoriaLogs_tenant_id_fkey` 
FOREIGN KEY (`tenant_id`) REFERENCES `Tenants`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

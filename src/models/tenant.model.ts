import { db } from '../config/db';
import { type Prisma } from '@prisma/client';

/**
 * Busca un tenant por su subdominio
 */
export const findTenantBySubdominio = async (subdominio: string) => {
    return db.tenants.findUnique({
        where: { subdominio },
    });
};

/**
 * Crea un nuevo tenant dentro de una transacción
 */
export const createTenant = async (
    data: { nombre_empresa: string, subdominio: string },
    tx: Prisma.TransactionClient
) => {
    return tx.tenants.create({
        data,
    });
};

/**
 * Busca un tenant por su ID
 */
export const findTenantById = async (id: number) => {
    return db.tenants.findUnique({
        where: { id },
    });
};

/**
 * Activa un tenant estableciendo isActive=true
 */
export const activateTenantById = async (
    id: number,
    tx?: Prisma.TransactionClient
) => {
    const prismaClient = tx || db;
    return prismaClient.tenants.update({
        where: { id },
        data: { isActive: true },
    });
};
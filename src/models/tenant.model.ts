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
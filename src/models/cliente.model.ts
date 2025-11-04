import { db } from '../config/db';
import { type Prisma } from '@prisma/client';

/**
 * Obtiene todos los clientes de un tenant específico
 */
export const findAllClientesByTenant = async (tenantId: number) => {
  return db.clientes.findMany({
    where: { tenant_id: tenantId },
    orderBy: { nombre: 'asc' },
  });
};

/**
 * Busca un cliente por id validando pertenencia al tenant
 */
export const findClienteByIdAndTenant = async (tenantId: number, id: number) => {
  return db.clientes.findFirst({
    where: { id, tenant_id: tenantId },
  });
};

/**
 * Crea un nuevo cliente para un tenant específico
 */
export const createCliente = async (
  data: any, // TODO: Definir DTO para tipado estricto
  tenantId: number,
  tx?: Prisma.TransactionClient
) => {
  const prismaClient = tx || db;
  return prismaClient.clientes.create({
    data: {
      nombre: data.nombre,
      documento_identidad: data.documento_identidad ?? null,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      direccion: data.direccion ?? null,
      tenant_id: tenantId,
    },
  });
};
import { db } from '../config/db';
import { type Prisma } from '@prisma/client';

/**
 * Obtiene todas las categorías de un tenant específico
 */
export const findAllCategoriasByTenant = async (tenantId: number) => {
  return db.categorias.findMany({
    where: { tenant_id: tenantId },
    orderBy: { nombre: 'asc' },
  });
};

/**
 * Busca una categoría por id validando pertenencia al tenant
 */
export const findCategoriaByIdAndTenant = async (tenantId: number, id: number) => {
  return db.categorias.findFirst({
    where: { id, tenant_id: tenantId },
  });
};

/**
 * Crea una nueva categoría para un tenant específico
 */
export const createCategoria = async (
  data: any, // TODO: Definir DTO para tipado estricto
  tenantId: number,
  tx?: Prisma.TransactionClient
) => {
  const prismaClient = tx || db;
  return prismaClient.categorias.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion ?? null,
      tenant_id: tenantId,
    },
  });
};
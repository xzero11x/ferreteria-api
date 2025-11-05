import { db } from '../config/db';
import { type Prisma } from '@prisma/client';
import { type CreateCategoriaDTO, type UpdateCategoriaDTO } from '../dtos/categoria.dto';

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
  data: CreateCategoriaDTO,
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

/**
 * Actualiza una categoría por id dentro de un tenant
 */
export const updateCategoriaByIdAndTenant = async (
  tenantId: number,
  id: number,
  data: UpdateCategoriaDTO
) => {
  const existing = await db.categorias.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;
  return db.categorias.update({
    where: { id },
    data: {
      nombre: data.nombre ?? existing.nombre,
      descripcion: data.descripcion ?? existing.descripcion,
    },
  });
};

/**
 * Elimina una categoría por id dentro de un tenant
 */
export const deleteCategoriaByIdAndTenant = async (tenantId: number, id: number) => {
  const existing = await db.categorias.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;
  return db.categorias.delete({ where: { id } });
};
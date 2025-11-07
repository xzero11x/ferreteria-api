import { db } from '../config/db';
import { type Prisma } from '@prisma/client';
import { type CreateProductoDTO, type UpdateProductoDTO } from '../dtos/producto.dto';

/**
 * Obtiene todos los productos de un tenant específico (solo activos)
 */
export const findAllProductosByTenant = async (tenantId: number) => {
  return db.productos.findMany({
    where: {
      tenant_id: tenantId,
      isActive: true,
    },
    include: {
      categoria: {
        select: {
          nombre: true,
        },
      },
    },
  });
};

/**
 * Busca un producto por id validando pertenencia al tenant
 */
export const findProductoByIdAndTenant = async (tenantId: number, id: number) => {
  return db.productos.findFirst({
    where: { id, tenant_id: tenantId },
    include: {
      categoria: { select: { nombre: true } },
    },
  });
};

/**
 * Crea un nuevo producto para un tenant específico
 */
export const createProducto = async (
  data: CreateProductoDTO,
  tenantId: number,
  tx?: Prisma.TransactionClient
) => {
  const prismaClient = tx || db;
  const { categoria_id, ...productoData } = data;

  // Validación multi-tenant: si se especifica categoría, debe pertenecer al mismo tenant
  if (categoria_id) {
    const categoria = await prismaClient.categorias.findUnique({
      where: { id: categoria_id },
      select: { id: true, tenant_id: true },
    });
    if (!categoria || categoria.tenant_id !== tenantId) {
      const err = new Error('La categoría no pertenece a este tenant');
      (err as any).code = 'TENANT_MISMATCH';
      throw err;
    }
  }

  return prismaClient.productos.create({
    data: {
      ...productoData,
      tenant_id: tenantId,
      ...(categoria_id && { categoria_id }),
    },
  });
};

/**
 * Actualiza un producto por id dentro de un tenant
 */
export const updateProductoByIdAndTenant = async (
  tenantId: number,
  id: number,
  data: UpdateProductoDTO
) => {
  // Verificar existencia y pertenencia al tenant
  const existing = await db.productos.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;

  // Validar que la categoría pertenezca al tenant si se intenta cambiar
  if (data.categoria_id) {
    const categoria = await db.categorias.findUnique({
      where: { id: data.categoria_id },
      select: { id: true, tenant_id: true },
    });
    if (!categoria || categoria.tenant_id !== tenantId) {
      const err = new Error('La categoría no pertenece a este tenant');
      (err as any).code = 'TENANT_MISMATCH';
      throw err;
    }
  }

  return db.productos.update({
    where: { id },
    data: {
      ...data,
      // no permitir cambiar tenant_id
    },
  });
};

/**
 * Desactiva un producto por id dentro de un tenant (borrado lógico)
 */
export const desactivarProductoByIdAndTenant = async (tenantId: number, id: number) => {
  const existing = await db.productos.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;
  return db.productos.update({ 
    where: { id }, 
    data: { isActive: false } 
  });
};
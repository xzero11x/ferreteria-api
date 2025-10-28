import { db } from '../config/db';
import { type Prisma } from '@prisma/client';

/**
 * Obtiene todos los productos de un tenant específico
 */
export const findAllProductosByTenant = async (tenantId: number) => {
  return db.productos.findMany({
    where: {
      tenant_id: tenantId,
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
 * Crea un nuevo producto para un tenant específico
 */
export const createProducto = async (
  data: any, // TODO: Implementar DTO para tipado estricto
  tenantId: number,
  tx?: Prisma.TransactionClient
) => {
  const prismaClient = tx || db;
  const { categoria_id, ...productoData } = data;

  return prismaClient.productos.create({
    data: {
      ...productoData,
      tenant_id: tenantId,
      ...(categoria_id && {
        categoria: {
          connect: {
            id: categoria_id,
          },
        },
      }),
    },
  });
};

// (Aquí irán 'updateProducto', 'deleteProducto', etc., más adelante)
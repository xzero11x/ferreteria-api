import { db } from '../config/db';
import { type Prisma } from '@prisma/client';

/**
 * Obtiene todos los proveedores de un tenant específico
 */
export const findAllProveedoresByTenant = async (tenantId: number) => {
  return db.proveedores.findMany({
    where: { tenant_id: tenantId },
    orderBy: { nombre: 'asc' },
  });
};

/**
 * Busca un proveedor por id validando pertenencia al tenant
 */
export const findProveedorByIdAndTenant = async (tenantId: number, id: number) => {
  return db.proveedores.findFirst({
    where: { id, tenant_id: tenantId },
  });
};

/**
 * Crea un nuevo proveedor para un tenant específico
 */
export const createProveedor = async (
  data: any, // TODO: Definir DTO para tipado estricto
  tenantId: number,
  tx?: Prisma.TransactionClient
) => {
  const prismaClient = tx || db;
  return prismaClient.proveedores.create({
    data: {
      nombre: data.nombre,
      ruc_identidad: data.ruc_identidad ?? null,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      direccion: data.direccion ?? null,
      tenant_id: tenantId,
    },
  });
};
import { db } from '../config/db';
import { type Usuarios, type Prisma } from '@prisma/client';

/**
 * Busca un usuario por email dentro de un tenant específico
 */
export const findUsuarioByEmailAndTenant = async (tenantId: number, email: string) => {
  return db.usuarios.findUnique({
    where: {
      tenant_id_email: {
        tenant_id: tenantId,
        email: email,
      },
    },
  });
};

/**
 * Crea un nuevo usuario dentro de una transacción
 */
export const createUsuario = async (
  data: Omit<Usuarios, 'id' | 'tenant_id'>, 
  tenantId: number,
  tx: Prisma.TransactionClient
) => {
  return tx.usuarios.create({
    data: {
      ...data,
      tenant_id: tenantId
    }
  });
};
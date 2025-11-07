import { db } from '../config/db';
import { type Prisma } from '@prisma/client';
import { type CreateClienteDTO, type UpdateClienteDTO } from '../dtos/cliente.dto';

/**
 * Obtiene todos los clientes de un tenant específico (solo activos)
 */
export const findAllClientesByTenant = async (tenantId: number) => {
  return db.clientes.findMany({
    where: { 
      tenant_id: tenantId,
      isActive: true,
    },
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
  data: CreateClienteDTO,
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

/**
 * Actualiza un cliente por id dentro de un tenant
 */
export const updateClienteByIdAndTenant = async (
  tenantId: number,
  id: number,
  data: UpdateClienteDTO
) => {
  const existing = await db.clientes.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;
  return db.clientes.update({
    where: { id },
    data: {
      nombre: data.nombre ?? existing.nombre,
      documento_identidad: data.documento_identidad ?? existing.documento_identidad,
      email: data.email ?? existing.email,
      telefono: data.telefono ?? existing.telefono,
      direccion: data.direccion ?? existing.direccion,
    },
  });
};

/**
 * Desactiva un cliente por id dentro de un tenant (borrado lógico)
 */
export const desactivarClienteByIdAndTenant = async (tenantId: number, id: number) => {
  const existing = await db.clientes.findFirst({ where: { id, tenant_id: tenantId } });
  if (!existing) return null;
  return db.clientes.update({ 
    where: { id }, 
    data: { isActive: false } 
  });
};
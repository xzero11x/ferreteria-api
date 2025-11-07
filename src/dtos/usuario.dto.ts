import { z } from 'zod';
import { RolUsuario } from '@prisma/client';

// Enum de roles
export const RolUsuarioEnum = z.nativeEnum(RolUsuario);

/**
 * DTO para crear un nuevo usuario (empleado)
 */
export const CreateUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'Nombre es requerido').max(255).optional(),
  rol: RolUsuarioEnum.default(RolUsuario.empleado),
});
export type CreateUsuarioDTO = z.infer<typeof CreateUsuarioSchema>;

/**
 * DTO para actualizar un usuario existente
 */
export const UpdateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  nombre: z.string().max(255).optional(),
  rol: RolUsuarioEnum.optional(),
});
export type UpdateUsuarioDTO = z.infer<typeof UpdateUsuarioSchema>;

import { z } from 'zod';

export const CreateClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  documento_identidad: z.string().min(1).optional(),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export type CreateClienteDTO = z.infer<typeof CreateClienteSchema>;

// Actualización parcial de cliente: requiere al menos un campo
export const UpdateClienteSchema = CreateClienteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo a actualizar' }
);

export type UpdateClienteDTO = z.infer<typeof UpdateClienteSchema>;
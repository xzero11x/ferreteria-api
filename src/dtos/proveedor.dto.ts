import { z } from 'zod';

export const CreateProveedorSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  ruc_identidad: z.string().min(1).optional(),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export type CreateProveedorDTO = z.infer<typeof CreateProveedorSchema>;

// Actualización parcial de proveedor: requiere al menos un campo
export const UpdateProveedorSchema = CreateProveedorSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo a actualizar' }
);

export type UpdateProveedorDTO = z.infer<typeof UpdateProveedorSchema>;
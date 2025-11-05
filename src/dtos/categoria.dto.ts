import { z } from 'zod';

export const CreateCategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
});

export type CreateCategoriaDTO = z.infer<typeof CreateCategoriaSchema>;

// Actualización parcial de categoría: requiere al menos un campo
export const UpdateCategoriaSchema = CreateCategoriaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo a actualizar' }
);

export type UpdateCategoriaDTO = z.infer<typeof UpdateCategoriaSchema>;
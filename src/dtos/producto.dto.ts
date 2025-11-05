import { z } from 'zod';

export const CreateProductoSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  sku: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  precio_venta: z.number().positive('precio_venta debe ser > 0'),
  costo_compra: z.number().positive().optional(),
  stock: z.number().int('stock debe ser entero').nonnegative('stock debe ser >= 0'),
  stock_minimo: z.number().int().nonnegative().optional(),
  categoria_id: z.number().int().optional(),
});

export type CreateProductoDTO = z.infer<typeof CreateProductoSchema>;

// Actualización parcial de producto: requiere al menos un campo
export const UpdateProductoSchema = CreateProductoSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo a actualizar' }
);

export type UpdateProductoDTO = z.infer<typeof UpdateProductoSchema>;
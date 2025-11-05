import { z } from 'zod';

/**
 * DTO para crear una nueva venta (POS)
 */
export const CreateVentaSchema = z.object({
  cliente_id: z.number().int().positive().optional(),
  metodo_pago: z.string().max(100).optional(),
  detalles: z.array(
    z.object({
      producto_id: z.number().int().positive('ID de producto requerido'),
      cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
      precio_unitario: z.number().positive('Precio debe ser mayor a 0'),
    })
  ).min(1, 'Debe incluir al menos un producto en la venta'),
});
export type CreateVentaDTO = z.infer<typeof CreateVentaSchema>;

/**
 * DTO para actualizar una venta existente
 * Nota: En general las ventas no se editan, solo se consultan o anulan
 */
export const UpdateVentaSchema = z.object({
  metodo_pago: z.string().max(100).optional(),
  // Futuro: agregar campo 'anulada' o 'estado' si se requiere
});
export type UpdateVentaDTO = z.infer<typeof UpdateVentaSchema>;

/**
 * Query params para listar ventas
 */
export const ListVentasQuerySchema = z.object({
  cliente_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
});
export type ListVentasQueryDTO = z.infer<typeof ListVentasQuerySchema>;

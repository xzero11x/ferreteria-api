import { z } from 'zod';

/**
 * Enum para estado de orden de compra
 */
export const EstadoOrdenCompraEnum = z.enum(['pendiente', 'recibida', 'cancelada']);
export type EstadoOrdenCompraType = z.infer<typeof EstadoOrdenCompraEnum>;

/**
 * DTO para crear una nueva orden de compra
 */
export const CreateOrdenCompraSchema = z.object({
  proveedor_id: z.number().int().positive().optional(),
  detalles: z.array(
    z.object({
      producto_id: z.number().int().positive('ID de producto requerido'),
      cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
      costo_unitario: z.number().positive('Costo debe ser mayor a 0'),
    })
  ).min(1, 'Debe incluir al menos un producto en la orden de compra'),
});
export type CreateOrdenCompraDTO = z.infer<typeof CreateOrdenCompraSchema>;

/**
 * DTO para actualizar una orden de compra existente
 */
export const UpdateOrdenCompraSchema = z.object({
  proveedor_id: z.number().int().positive().optional(),
  estado: EstadoOrdenCompraEnum.optional(),
});
export type UpdateOrdenCompraDTO = z.infer<typeof UpdateOrdenCompraSchema>;

/**
 * DTO para registrar la recepción de una orden de compra
 * Esto actualiza el stock de los productos
 */
export const RecibirOrdenCompraSchema = z.object({
  fecha_recepcion: z.string().datetime().optional(), // Si no se proporciona, usa fecha actual
});
export type RecibirOrdenCompraDTO = z.infer<typeof RecibirOrdenCompraSchema>;

/**
 * Query params para listar órdenes de compra
 */
export const ListOrdenesCompraQuerySchema = z.object({
  proveedor_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  estado: EstadoOrdenCompraEnum.optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
});
export type ListOrdenesCompraQueryDTO = z.infer<typeof ListOrdenesCompraQuerySchema>;

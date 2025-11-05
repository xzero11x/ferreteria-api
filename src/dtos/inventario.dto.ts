import { z } from 'zod';

/**
 * Enum para tipo de ajuste de inventario
 */
export const TipoAjusteEnum = z.enum(['entrada', 'salida']);
export type TipoAjusteType = z.infer<typeof TipoAjusteEnum>;

/**
 * DTO para crear un nuevo ajuste de inventario
 */
export const CreateInventarioAjusteSchema = z.object({
  producto_id: z.number().int().positive('ID de producto requerido'),
  tipo: TipoAjusteEnum,
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
  motivo: z.string().min(3, 'Motivo debe tener al menos 3 caracteres').max(500),
});
export type CreateInventarioAjusteDTO = z.infer<typeof CreateInventarioAjusteSchema>;

/**
 * Query params para listar ajustes de inventario
 */
export const ListInventarioAjustesQuerySchema = z.object({
  producto_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  tipo: TipoAjusteEnum.optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
});
export type ListInventarioAjustesQueryDTO = z.infer<typeof ListInventarioAjustesQuerySchema>;

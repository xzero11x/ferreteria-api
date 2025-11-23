import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi-registry';
import { montoDecimalSchema } from './common.dto';

extendZodWithOpenApi(z);

/**
 * DTO para crear un movimiento de caja
 */
export const CreateMovimientoCajaSchema = registry.register(
  'CreateMovimientoCaja',
  z.object({
    tipo: z.enum(['INGRESO', 'EGRESO']).openapi({
      description: 'Tipo de movimiento',
      example: 'INGRESO',
    }),
    monto: montoDecimalSchema.openapi({
      description: 'Monto del movimiento (máximo 2 decimales)',
      example: 50.00,
    }),
    descripcion: z.string().min(1, 'La descripción es requerida').max(255).openapi({
      description: 'Descripción del movimiento',
      example: 'Pago de luz',
    }),
  })
);

export type CreateMovimientoCajaDTO = z.infer<typeof CreateMovimientoCajaSchema>;

/**
 * DTO de respuesta para movimiento de caja
 */
export const MovimientoCajaResponseSchema = registry.register(
  'MovimientoCaja',
  z.object({
    id: z.number().int().openapi({
      description: 'ID único del movimiento',
      example: 1,
    }),
    tipo: z.enum(['INGRESO', 'EGRESO']).openapi({
      description: 'Tipo de movimiento',
      example: 'INGRESO',
    }),
    monto: z.number().openapi({
      description: 'Monto del movimiento',
      example: 50.00,
    }),
    descripcion: z.string().openapi({
      description: 'Descripción del movimiento',
      example: 'Pago de luz',
    }),
    fecha: z.string().datetime().openapi({
      description: 'Fecha del movimiento',
      example: '2025-11-16T14:30:00Z',
    }),
    sesion_caja_id: z.number().int().openapi({
      description: 'ID de la sesión de caja',
      example: 1,
    }),
    sesion_caja: z.object({
      id: z.number().int(),
      caja: z.object({
        nombre: z.string(),
      }),
    }).optional(),
    tenant_id: z.number().int().openapi({ example: 1 }),
  })
);

export type MovimientoCajaResponseDTO = z.infer<typeof MovimientoCajaResponseSchema>;

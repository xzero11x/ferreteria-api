import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi-registry';
import { montoDecimalSchema } from './common.dto';

extendZodWithOpenApi(z);

// Helper específico para monto inicial (debe ser positivo)
const montoInicialSchema = montoDecimalSchema.pipe(
  z.number().positive('El monto inicial debe ser mayor a 0')
);

// Helper específico para monto final (puede ser cero)
const montoFinalSchema = montoDecimalSchema.pipe(
  z.number().nonnegative('El monto final no puede ser negativo')
);

/**
 * DTO para apertura de sesión de caja
 */
export const AperturaSesionCajaSchema = registry.register(
  'AperturaSesionCaja',
  z.object({
    caja_id: z.number().int().positive('El ID de caja debe ser un número positivo').openapi({
      description: 'ID de la caja registradora',
      example: 1,
    }),
    monto_inicial: montoInicialSchema.openapi({
      description: 'Monto inicial en efectivo al abrir la caja (máximo 2 decimales)',
      example: 100.00,
    }),
  })
);

export type AperturaSesionCajaDTO = z.infer<typeof AperturaSesionCajaSchema>;

/**
 * DTO para cierre de sesión de caja
 */
export const CierreSesionCajaSchema = registry.register(
  'CierreSesionCaja',
  z.object({
    monto_final: montoFinalSchema.openapi({
      description: 'Monto final en efectivo al cerrar (arqueo, máximo 2 decimales)',
      example: 450.00,
    }),
  })
);

export type CierreSesionCajaDTO = z.infer<typeof CierreSesionCajaSchema>;

/**
 * DTO para cierre administrativo de sesión
 * Permite a supervisores/admins cerrar sesiones de otros usuarios
 */
export const CierreAdministrativoSchema = registry.register(
  'CierreAdministrativo',
  z.object({
    monto_final: montoFinalSchema.openapi({
      description: 'Monto contado físicamente en la caja al momento del cierre forzoso',
      example: 450.00,
    }),
    motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').openapi({
      description: 'Razón por la cual se realiza el cierre administrativo',
      example: 'Usuario no cerró su turno. Supervisor contó el efectivo y realizó arqueo.',
    }),
  })
);

export type CierreAdministrativoDTO = z.infer<typeof CierreAdministrativoSchema>;

/**
 * DTO de respuesta de sesión
 */
export const SesionCajaResponseSchema = registry.register(
  'SesionCaja',
  z.object({
    id: z.number().int().openapi({
      description: 'ID único de la sesión',
      example: 1,
    }),
    fecha_apertura: z.string().datetime().openapi({
      description: 'Fecha y hora de apertura',
      example: '2025-11-16T08:00:00Z',
    }),
    fecha_cierre: z.string().datetime().nullable().openapi({
      description: 'Fecha y hora de cierre',
      example: '2025-11-16T18:00:00Z',
    }),
    monto_inicial: z.number().openapi({
      description: 'Monto inicial',
      example: 100.00,
    }),
    monto_final: z.number().nullable().openapi({
      description: 'Monto final (arqueo)',
      example: 450.00,
    }),
    total_ventas: z.number().nullable().openapi({
      description: 'Total de ventas en la sesión',
      example: 380.00,
    }),
    total_egresos: z.number().nullable().openapi({
      description: 'Total de egresos',
      example: 30.00,
    }),
    diferencia: z.number().nullable().openapi({
      description: 'Diferencia entre esperado y arqueo',
      example: 0.00,
    }),
    estado: z.enum(['ABIERTA', 'CERRADA']).openapi({
      description: 'Estado de la sesión',
      example: 'ABIERTA',
    }),
    caja_id: z.number().int().openapi({ example: 1 }),
    caja: z.object({
      id: z.number().int(),
      nombre: z.string(),
    }).optional(),
    usuario_id: z.number().int().openapi({ example: 1 }),
    usuario: z.object({
      id: z.number().int(),
      nombre: z.string().nullable(),
      email: z.string(),
    }).optional(),
    tenant_id: z.number().int().openapi({ example: 1 }),
  })
);

export type SesionCajaResponseDTO = z.infer<typeof SesionCajaResponseSchema>;

/**
 * DTO para consulta de sesión activa
 */
export const SesionActivaResponseSchema = registry.register(
  'SesionActivaResponse',
  z.object({
    sesion: SesionCajaResponseSchema.nullable().openapi({
      description: 'Sesión activa del usuario (null si no hay ninguna)',
    }),
    tiene_sesion_activa: z.boolean().openapi({
      description: 'Indica si el usuario tiene una sesión activa',
      example: true,
    }),
  })
);

export type SesionActivaResponseDTO = z.infer<typeof SesionActivaResponseSchema>;

/**
 * Schema para query del historial de sesiones
 */
export const HistorialSesionesQuerySchema = registry.register(
  'HistorialSesionesQuery',
  z.object({
    caja_id: z.coerce.number().int().positive().optional().openapi({
      description: 'Filtrar por ID de caja',
      example: 1,
    }),
    usuario_id: z.coerce.number().int().positive().optional().openapi({
      description: 'Filtrar por ID de usuario',
      example: 1,
    }),
    limit: z.coerce.number().int().positive().optional().default(50).openapi({
      description: 'Límite de resultados',
      example: 50,
    }),
  })
);

export type HistorialSesionesQueryDTO = z.infer<typeof HistorialSesionesQuerySchema>;

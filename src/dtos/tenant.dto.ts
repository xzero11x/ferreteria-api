import { z } from 'zod';

// Configuración editable del tenant
export const TenantConfiguracionSchema = z
  .object({
    pedidos: z
      .object({
        dias_limite_reserva: z.number().int().min(1).max(30),
      })
      .partial()
      .optional(),
    emails: z
      .object({
        remitente: z.string().email().optional(),
        plantilla_confirmacion: z.string().optional(),
        plantilla_cancelacion: z.string().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export type TenantConfiguracionDTO = z.infer<typeof TenantConfiguracionSchema>;
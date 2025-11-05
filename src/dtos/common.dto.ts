import { z } from 'zod';

// Valida parámetros de ruta con `id` numérico positivo
export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type IdParamDTO = z.infer<typeof IdParamSchema>;
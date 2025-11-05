import { z } from 'zod';

export const RegisterTenantSchema = z.object({
  nombre_empresa: z.string().min(1, 'Nombre de empresa es requerido'),
  subdominio: z
    .string()
    .min(3, 'Subdominio debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdominio solo permite minúsculas, números y guiones'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

export type RegisterTenantDTO = z.infer<typeof RegisterTenantSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// Verificación manual del tenant: requiere al menos tenantId o subdominio
export const VerifyTenantSchema = z
  .object({
    tenantId: z.number().int().optional(),
    subdominio: z.string().min(1).optional(),
  })
  .refine((data) => data.tenantId || data.subdominio, {
    message: 'Se requiere tenantId o subdominio.',
    path: ['tenantId', 'subdominio'],
  });

export type VerifyTenantDTO = z.infer<typeof VerifyTenantSchema>;
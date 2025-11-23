import { Router } from 'express';
import { z } from 'zod';
import {
  abrirSesionHandler,
  cerrarSesionHandler,
  getSesionActivaHandler,
  getHistorialSesionesHandler,
  getSesionByIdHandler,
  cerrarSesionAdministrativoHandler,
} from '../controllers/sesiones-caja.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import { registry, commonResponses } from '../config/openapi-registry';
import {
  AperturaSesionCajaSchema,
  CierreSesionCajaSchema,
  CierreAdministrativoSchema,
  SesionCajaResponseSchema,
  SesionActivaResponseSchema,
  HistorialSesionesQuerySchema,
} from '../dtos/sesion-caja.dto';
import { IdParamSchema } from '../dtos/common.dto';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

// ==================== POST /sesiones-caja/apertura ====================
registry.registerPath({
  method: 'post',
  path: '/api/sesiones-caja/apertura',
  tags: ['Sesiones de Caja'],
  summary: 'Abrir una nueva sesión de caja',
  description: 'Inicia una sesión de caja para el usuario autenticado con monto inicial.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AperturaSesionCajaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Sesión de caja abierta exitosamente',
      content: {
        'application/json': {
          schema: SesionCajaResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.post(
  '/apertura',
  requireRoles(['admin', 'empleado']),
  validateRequest(z.object({ body: AperturaSesionCajaSchema })),
  abrirSesionHandler
);

// ==================== POST /sesiones-caja/:id/cierre ====================
registry.registerPath({
  method: 'post',
  path: '/api/sesiones-caja/{id}/cierre',
  tags: ['Sesiones de Caja'],
  summary: 'Cerrar una sesión de caja',
  description: 'Cierra una sesión de caja con monto final y calcula diferencias.',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: CierreSesionCajaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sesión de caja cerrada exitosamente',
      content: {
        'application/json': {
          schema: SesionCajaResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.post(
  '/:id/cierre',
  requireRoles(['admin', 'empleado']),
  validateRequest(z.object({ params: IdParamSchema, body: CierreSesionCajaSchema })),
  cerrarSesionHandler
);

// ==================== GET /sesiones-caja/activa ====================
registry.registerPath({
  method: 'get',
  path: '/api/sesiones-caja/activa',
  tags: ['Sesiones de Caja'],
  summary: 'Obtener sesión activa del usuario',
  description: 'Consulta si el usuario autenticado tiene una sesión de caja abierta.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Consulta exitosa (puede retornar null si no hay sesión activa)',
      content: {
        'application/json': {
          schema: SesionActivaResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.get(
  '/activa',
  requireRoles(['admin', 'empleado']),
  getSesionActivaHandler
);

// ==================== GET /sesiones-caja/historial ====================
registry.registerPath({
  method: 'get',
  path: '/api/sesiones-caja/historial',
  tags: ['Sesiones de Caja'],
  summary: 'Obtener historial de sesiones',
  description: 'Lista el historial de sesiones con filtros opcionales por caja y usuario.',
  security: [{ bearerAuth: [] }],
  request: {
    query: HistorialSesionesQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista de sesiones',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(SesionCajaResponseSchema),
          }),
        },
      },
    },
    ...commonResponses,
  },
});

router.get(
  '/historial',
  requireRoles(['admin', 'empleado']),
  validateRequest(z.object({ query: HistorialSesionesQuerySchema })),
  getHistorialSesionesHandler
);

// ==================== GET /sesiones-caja/:id ====================
registry.registerPath({
  method: 'get',
  path: '/api/sesiones-caja/{id}',
  tags: ['Sesiones de Caja'],
  summary: 'Obtener una sesión por ID',
  description: 'Consulta los detalles de una sesión de caja específica.',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Sesión encontrada',
      content: {
        'application/json': {
          schema: SesionCajaResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.get(
  '/:id',
  requireRoles(['admin', 'empleado']),
  validateRequest(z.object({ params: IdParamSchema })),
  getSesionByIdHandler
);

// ==================== POST /sesiones-caja/:id/cierre-administrativo ====================
registry.registerPath({
  method: 'post',
  path: '/api/sesiones-caja/{id}/cierre-administrativo',
  tags: ['Sesiones de Caja'],
  summary: 'Cierre administrativo de sesión (Solo Supervisores)',
  description: `
    Permite a un supervisor/admin cerrar una sesión de caja de otro usuario.
    
    **Caso de uso típico:**
    - Empleado Pedro dejó su sesión abierta y se fue sin cerrarla
    - Empleado Juan necesita usar esa caja pero está bloqueada
    - El Supervisor cuenta el dinero físico que dejó Pedro
    - El Supervisor ejecuta este endpoint para cerrar la sesión de Pedro
    - Juan ya puede abrir su turno normalmente
    
    **Auditoría:**
    El sistema registra quién realizó el cierre administrativo y el motivo.
    
    **Diferencia con cierre normal:**
    - Cierre normal: Solo el dueño de la sesión puede cerrarla
    - Cierre administrativo: Un supervisor cierra la sesión de otro usuario
  `,
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: CierreAdministrativoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sesión cerrada administrativamente',
      content: {
        'application/json': {
          schema: SesionCajaResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.post(
  '/:id/cierre-administrativo',
  requireRoles(['admin']), // Solo admins pueden hacer cierre administrativo
  validateRequest(z.object({ 
    params: IdParamSchema, 
    body: CierreAdministrativoSchema 
  })),
  cerrarSesionAdministrativoHandler
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { getDashboardVentasEstadisticasHandler } from '../controllers/dashboard.controller';
import { registry, commonResponses } from '../config/openapi-registry';
import {
  DashboardVentasEstadisticasResponseSchema,
  DashboardQuerySchema,
} from '../dtos/dashboard.dto';

const router = Router();

// Proteger todas las rutas con autenticación y tenant
router.use(checkTenant, checkAuth);

// ==================== GET /dashboard/ventas/estadisticas ====================
registry.registerPath({
  method: 'get',
  path: '/api/dashboard/ventas/estadisticas',
  tags: ['Dashboard'],
  summary: 'Obtener estadísticas del dashboard de ventas',
  description: 'Retorna KPIs, serie temporal, top productos rentables y rentabilidad por categoría. Permite filtrar por rango de fechas.',
  security: [{ bearerAuth: [] }],
  request: {
    query: DashboardQuerySchema,
  },
  responses: {
    200: {
      description: 'Estadísticas del dashboard de ventas',
      content: {
        'application/json': {
          schema: DashboardVentasEstadisticasResponseSchema,
        },
      },
    },
    ...commonResponses,
  },
});

router.get(
  '/ventas/estadisticas',
  validateRequest(z.object({ query: DashboardQuerySchema })),
  getDashboardVentasEstadisticasHandler
);

export default router;

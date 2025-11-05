import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getTenantConfiguracionHandler,
  updateTenantConfiguracionHandler,
} from '../controllers/tenant.controller';

const router = Router();

// Middlewares
router.use(checkTenant);
router.use(checkAuth);

// Endpoints de configuración del tenant
router.get('/configuracion', getTenantConfiguracionHandler);
router.put('/configuracion', requireRoles(['admin']), updateTenantConfiguracionHandler);

export default router;
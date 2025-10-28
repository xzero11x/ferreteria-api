import { Router } from 'express';
import {
    registerTenantHandler,
    loginHandler
} from '../controllers/auth.controller';
import { checkTenant } from '../middlewares/tenant.middleware';

const router = Router();

// Ruta pública - no requiere subdominio
router.post('/register', registerTenantHandler);

// Ruta privada - requiere subdominio válido
router.post('/login', checkTenant, loginHandler);

export default router;

import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import { getKardexCompletoHandler } from '../controllers/reportes.controller';

const router = Router();

// Aplicar middlewares de seguridad
router.use(checkTenant);
router.use(checkAuth);

// Ruta de Kardex completo
router.get('/kardex/:productoId', getKardexCompletoHandler);

export default router;

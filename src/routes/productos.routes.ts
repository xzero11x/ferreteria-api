import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
    getProductosHandler,
    createProductoHandler
} from '../controllers/productos.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de productos
router.get('/', getProductosHandler);
router.post('/', createProductoHandler);

export default router;

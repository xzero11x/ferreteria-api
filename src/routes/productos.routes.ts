import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
    getProductosHandler,
    createProductoHandler,
    getProductoByIdHandler,
    updateProductoHandler,
    desactivarProductoHandler
} from '../controllers/productos.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de productos
// GET: accesible para admin y empleado
router.get('/', getProductosHandler);
router.get('/:id', getProductoByIdHandler);

// POST, PUT: solo admin
router.post('/', requireRoles(['admin']), createProductoHandler);
router.put('/:id', requireRoles(['admin']), updateProductoHandler);

// PATCH (desactivar): solo admin
router.patch('/:id/desactivar', requireRoles(['admin']), desactivarProductoHandler);

export default router;

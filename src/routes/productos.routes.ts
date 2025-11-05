import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
    getProductosHandler,
    createProductoHandler,
    getProductoByIdHandler,
    updateProductoHandler,
    deleteProductoHandler
} from '../controllers/productos.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de productos
// GET: accesible para admin y empleado
router.get('/', getProductosHandler);
router.get('/:id', getProductoByIdHandler);

// POST, PUT, DELETE: solo admin
router.post('/', requireRoles(['admin']), createProductoHandler);
router.put('/:id', requireRoles(['admin']), updateProductoHandler);
router.delete('/:id', requireRoles(['admin']), deleteProductoHandler);

export default router;

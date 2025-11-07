import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getProveedoresHandler,
  createProveedorHandler,
  getProveedorByIdHandler,
  updateProveedorHandler,
  desactivarProveedorHandler,
} from '../controllers/proveedores.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de proveedores
// GET: accesible para admin y empleado
router.get('/', getProveedoresHandler);
router.get('/:id', getProveedorByIdHandler);

// POST, PUT: accesible para admin y empleado
router.post('/', requireRoles(['admin', 'empleado']), createProveedorHandler);
router.put('/:id', requireRoles(['admin', 'empleado']), updateProveedorHandler);

// PATCH (desactivar): solo admin
router.patch('/:id/desactivar', requireRoles(['admin']), desactivarProveedorHandler);

export default router;
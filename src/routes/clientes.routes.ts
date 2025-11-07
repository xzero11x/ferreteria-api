import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getClientesHandler,
  createClienteHandler,
  getClienteByIdHandler,
  updateClienteHandler,
  desactivarClienteHandler,
} from '../controllers/clientes.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de clientes
// GET: accesible para admin y empleado
router.get('/', getClientesHandler);
router.get('/:id', getClienteByIdHandler);

// POST, PUT: accesible para admin y empleado
router.post('/', requireRoles(['admin', 'empleado']), createClienteHandler);
router.put('/:id', requireRoles(['admin', 'empleado']), updateClienteHandler);

// PATCH (desactivar): solo admin
router.patch('/:id/desactivar', requireRoles(['admin']), desactivarClienteHandler);

export default router;
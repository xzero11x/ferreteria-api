import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getOrdenesCompraHandler,
  getOrdenCompraByIdHandler,
  createOrdenCompraHandler,
  updateOrdenCompraHandler,
  recibirOrdenCompraHandler,
  cancelarOrdenCompraHandler,
  deleteOrdenCompraHandler,
} from '../controllers/ordenes-compra.controller';

const router = Router();

// Middlewares de seguridad
router.use(checkTenant);
router.use(checkAuth);

// Rutas de órdenes de compra
// GET: accesible para admin y empleado (consulta)
router.get('/', getOrdenesCompraHandler);
router.get('/:id', getOrdenCompraByIdHandler);

// POST: admin puede crear órdenes, empleado (almacenero) puede recibir mercadería
router.post('/', requireRoles(['admin']), createOrdenCompraHandler);
router.post('/:id/recibir', requireRoles(['admin', 'empleado']), recibirOrdenCompraHandler);
router.post('/:id/cancelar', requireRoles(['admin']), cancelarOrdenCompraHandler);

// PUT, DELETE: solo admin
router.put('/:id', requireRoles(['admin']), updateOrdenCompraHandler);
router.delete('/:id', requireRoles(['admin']), deleteOrdenCompraHandler);

export default router;

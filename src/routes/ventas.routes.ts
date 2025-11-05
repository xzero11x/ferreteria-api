import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getVentasHandler,
  getVentaByIdHandler,
  createVentaHandler,
  updateVentaHandler,
  deleteVentaHandler,
} from '../controllers/ventas.controller';

const router = Router();

// Middlewares de seguridad
router.use(checkTenant);
router.use(checkAuth);

// Rutas de ventas (POS)
// GET: accesible para admin y empleado
router.get('/', getVentasHandler);
router.get('/:id', getVentaByIdHandler);

// POST: accesible para admin y empleado (registrar venta)
router.post('/', requireRoles(['admin', 'empleado']), createVentaHandler);

// PUT, DELETE: solo admin (uso limitado)
router.put('/:id', requireRoles(['admin']), updateVentaHandler);
router.delete('/:id', requireRoles(['admin']), deleteVentaHandler);

export default router;

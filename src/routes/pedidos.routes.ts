import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getPedidosHandler,
  getPedidoByIdHandler,
  confirmarPedidoHandler,
  cancelarPedidoHandler,
  generarVentaDesdePedidoHandler,
} from '../controllers/pedidos.controller';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

router.get('/', getPedidosHandler);
router.get('/:id', getPedidoByIdHandler);
// Acciones sensibles: requerir rol admin o empleado
router.post('/:id/confirmar', requireRoles(['admin','empleado']), confirmarPedidoHandler);
router.post('/:id/cancelar', requireRoles(['admin','empleado']), cancelarPedidoHandler);
router.post('/:id/generar-venta', requireRoles(['admin','empleado']), generarVentaDesdePedidoHandler);

export default router;
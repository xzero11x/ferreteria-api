import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
  getClientesHandler,
  createClienteHandler,
  getClienteByIdHandler,
  updateClienteHandler,
  deleteClienteHandler,
} from '../controllers/clientes.controller';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

router.get('/', getClientesHandler);
router.post('/', createClienteHandler);
router.get('/:id', getClienteByIdHandler);
router.put('/:id', updateClienteHandler);
router.delete('/:id', deleteClienteHandler);

export default router;
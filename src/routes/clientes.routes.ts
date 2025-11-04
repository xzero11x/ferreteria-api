import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
  getClientesHandler,
  createClienteHandler,
} from '../controllers/clientes.controller';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

router.get('/', getClientesHandler);
router.post('/', createClienteHandler);

export default router;
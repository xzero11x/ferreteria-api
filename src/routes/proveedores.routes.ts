import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
  getProveedoresHandler,
  createProveedorHandler,
} from '../controllers/proveedores.controller';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

router.get('/', getProveedoresHandler);
router.post('/', createProveedorHandler);

export default router;
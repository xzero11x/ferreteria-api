import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
  getProveedoresHandler,
  createProveedorHandler,
  getProveedorByIdHandler,
  updateProveedorHandler,
  deleteProveedorHandler,
} from '../controllers/proveedores.controller';

const router = Router();

router.use(checkTenant);
router.use(checkAuth);

router.get('/', getProveedoresHandler);
router.post('/', createProveedorHandler);
router.get('/:id', getProveedorByIdHandler);
router.put('/:id', updateProveedorHandler);
router.delete('/:id', deleteProveedorHandler);

export default router;
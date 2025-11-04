import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth } from '../middlewares/auth.middleware';
import {
  getCategoriasHandler,
  createCategoriaHandler,
} from '../controllers/categorias.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de categorías
router.get('/', getCategoriasHandler);
router.post('/', createCategoriaHandler);

export default router;
import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getCategoriasHandler,
  createCategoriaHandler,
  getCategoriaByIdHandler,
  updateCategoriaHandler,
  desactivarCategoriaHandler,
} from '../controllers/categorias.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);

// Rutas de categorías
// GET: accesible para admin y empleado
router.get('/', getCategoriasHandler);
router.get('/:id', getCategoriaByIdHandler);

// POST, PUT: solo admin
router.post('/', requireRoles(['admin']), createCategoriaHandler);
router.put('/:id', requireRoles(['admin']), updateCategoriaHandler);

// PATCH (desactivar): solo admin
router.patch('/:id/desactivar', requireRoles(['admin']), desactivarCategoriaHandler);

export default router;
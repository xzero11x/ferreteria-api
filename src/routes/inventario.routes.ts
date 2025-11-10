import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getInventarioAjustesHandler,
  getInventarioAjusteByIdHandler,
  createInventarioAjusteHandler,
  deleteInventarioAjusteHandler,
} from '../controllers/inventario.controller';

const router = Router();

// Middlewares de seguridad
router.use(checkTenant);
router.use(checkAuth);

// Rutas de ajustes de inventario
// GET: accesible para admin y empleado (consulta)
router.get('/ajustes', getInventarioAjustesHandler);
router.get('/ajustes/:id', getInventarioAjusteByIdHandler);

// POST: solo admin (registrar ajustes manuales)
router.post('/ajustes', requireRoles(['admin']), createInventarioAjusteHandler);

// DELETE: solo admin (eliminar ajustes - uso limitado)
router.delete('/ajustes/:id', requireRoles(['admin']), deleteInventarioAjusteHandler);

export default router;

import { Router } from 'express';
import { checkTenant } from '../middlewares/tenant.middleware';
import { checkAuth, requireRoles } from '../middlewares/auth.middleware';
import {
  getUsuariosHandler,
  createUsuarioHandler,
  getUsuarioByIdHandler,
  updateUsuarioHandler,
  desactivarUsuarioHandler,
} from '../controllers/usuarios.controller';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas
router.use(checkTenant);
router.use(checkAuth);
router.use(requireRoles(['admin'])); // Solo admin puede gestionar usuarios

// Rutas de usuarios
router.get('/', getUsuariosHandler);
router.post('/', createUsuarioHandler);
router.get('/:id', getUsuarioByIdHandler);
router.put('/:id', updateUsuarioHandler);
router.patch('/:id/desactivar', desactivarUsuarioHandler);

export default router;

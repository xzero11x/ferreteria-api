import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as usuarioModel from '../models/usuario.model';
import { CreateUsuarioSchema, UpdateUsuarioSchema } from '../dtos/usuario.dto';
import { IdParamSchema } from '../dtos/common.dto';

/**
 * Obtiene todos los usuarios (empleados) del tenant autenticado (solo activos)
 */
export const getUsuariosHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const usuarios = await usuarioModel.findAllUsuariosByTenant(tenantId);
    res.status(200).json(usuarios);
  }
);

/**
 * Obtiene un usuario específico por id
 */
export const getUsuarioByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const usuario = await usuarioModel.findUsuarioByIdAndTenant(tenantId, parsedId.data.id);
    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }
    res.status(200).json(usuario);
  }
);

/**
 * Crea un nuevo usuario (empleado) para el tenant autenticado
 */
export const createUsuarioHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parse = CreateUsuarioSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const { password, ...userData } = parse.data;
      
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Crear usuario usando transacción
      const nuevoUsuario = await usuarioModel.createUsuario(
        {
          ...userData,
          nombre: userData.nombre ?? null,
          password_hash,
          isActive: true,
        },
        tenantId
      );

      res.status(201).json({
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El email ya existe en este tenant.' });
        return;
      }
      console.error('Error al crear usuario:', error);
      res.status(500).json({ message: 'Error al crear usuario.' });
    }
  }
);

/**
 * Actualiza un usuario por id
 */
export const updateUsuarioHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateUsuarioSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const { password, ...updateData } = parse.data;
      
      // Si se proporciona una nueva contraseña, hashearla
      let dataToUpdate = { ...updateData };
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        (dataToUpdate as any).password_hash = password_hash;
      }

      const updated = await usuarioModel.updateUsuarioByIdAndTenant(
        tenantId,
        parsedId.data.id,
        dataToUpdate
      );
      
      if (!updated) {
        res.status(404).json({ message: 'Usuario no encontrado.' });
        return;
      }
      
      res.status(200).json(updated);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El email ya existe en este tenant.' });
        return;
      }
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ message: 'Error al actualizar usuario.' });
    }
  }
);

/**
 * Desactiva un usuario por id (borrado lógico)
 */
export const desactivarUsuarioHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }

    // No permitir que un usuario se desactive a sí mismo
    if (req.user?.id === parsedId.data.id) {
      res.status(403).json({ message: 'No puedes desactivar tu propia cuenta.' });
      return;
    }

    const deleted = await usuarioModel.desactivarUsuarioByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }
    res.status(200).json({ message: 'Usuario desactivado.' });
  }
);

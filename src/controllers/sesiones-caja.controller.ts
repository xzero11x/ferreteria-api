import { type Response } from 'express';
import sesionCajaModel from '../models/sesion-caja.model';
import { type RequestWithAuth } from '../middlewares/auth.middleware';

export async function abrirSesionHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const usuarioId = req.user!.id;
    const sesion = await sesionCajaModel.abrirSesion(tenantId, usuarioId, req.body);
    res.status(201).json(sesion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function cerrarSesionHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const usuarioId = req.user!.id;
    const sesionId = Number(req.params.id);
    const sesion = await sesionCajaModel.cerrarSesion(sesionId, tenantId, usuarioId, req.body);
    res.status(200).json(sesion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSesionActivaHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const usuarioId = req.user!.id;
    const resultado = await sesionCajaModel.getSesionActiva(tenantId, usuarioId);
    res.status(200).json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getHistorialSesionesHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const cajaId = req.query.caja_id ? Number(req.query.caja_id) : undefined;
    const usuarioId = req.query.usuario_id ? Number(req.query.usuario_id) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const sesiones = await sesionCajaModel.getHistorialSesiones(tenantId, cajaId, usuarioId, limit);
    res.status(200).json({ data: sesiones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSesionByIdHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const sesionId = Number(req.params.id);
    const sesion = await sesionCajaModel.getSesionById(sesionId, tenantId);
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.status(200).json(sesion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Cierre Administrativo de Sesión
 * Solo para usuarios con rol ADMIN o SUPERVISOR
 * Permite cerrar sesiones de otros usuarios (ej: usuario no cerró su turno)
 */
export async function cerrarSesionAdministrativoHandler(req: RequestWithAuth, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const adminUsuarioId = req.user!.id;
    const sesionId = Number(req.params.id);
    
    // TODO: Verificar que el usuario tenga rol ADMIN o SUPERVISOR
    // Por ahora permitimos a cualquier usuario autenticado (implementar después)
    
    const sesion = await sesionCajaModel.cerrarSesionAdministrativo(
      sesionId,
      tenantId,
      adminUsuarioId,
      req.body
    );
    
    res.status(200).json(sesion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

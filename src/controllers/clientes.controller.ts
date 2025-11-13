import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as clienteModel from '../models/cliente.model';
import { CreateClienteSchema, UpdateClienteSchema } from '../dtos/cliente.dto';
import { IdParamSchema } from '../dtos/common.dto';

/**
 * Obtiene todos los clientes del tenant autenticado con paginación y búsqueda
 */
export const getClientesHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    
    // Extraer parámetros de paginación y búsqueda
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.q as string) || '';
    
    // Validar límites razonables
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * validLimit;
    
    // Obtener clientes paginados
    const { total, data } = await clienteModel.findClientesPaginados(tenantId, {
      skip,
      take: validLimit,
      search: search.trim() || undefined,
    });
    
    // Devolver datos con metadatos de paginación
    res.status(200).json({
      data,
      meta: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  }
);

/**
 * Crea un nuevo cliente para el tenant autenticado
 */
export const createClienteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parse = CreateClienteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nuevo = await clienteModel.createCliente(parse.data, tenantId);
      res.status(201).json(nuevo);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El documento de identidad ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear cliente.' });
    }
  }
);

/**
 * Obtiene un cliente específico por id
 */
export const getClienteByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const cliente = await clienteModel.findClienteByIdAndTenant(tenantId, parsedId.data.id);
    if (!cliente) {
      res.status(404).json({ message: 'Cliente no encontrado.' });
      return;
    }
    res.status(200).json(cliente);
  }
);

/**
 * Actualiza un cliente por id
 */
export const updateClienteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateClienteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }
    try {
      const updated = await clienteModel.updateClienteByIdAndTenant(
        tenantId,
        parsedId.data.id,
        parse.data
      );
      if (!updated) {
        res.status(404).json({ message: 'Cliente no encontrado.' });
        return;
      }
      res.status(200).json(updated);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'El documento de identidad ya existe en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar cliente.' });
    }
  }
);

/**
 * Desactiva un cliente por id (borrado lógico)
 */
export const desactivarClienteHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const deleted = await clienteModel.desactivarClienteByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Cliente no encontrado.' });
      return;
    }
    res.status(200).json({ message: 'Cliente desactivado.' });
  }
);
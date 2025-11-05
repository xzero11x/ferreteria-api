import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as categoriaModel from '../models/categoria.model';
import { CreateCategoriaSchema, UpdateCategoriaSchema } from '../dtos/categoria.dto';
import { IdParamSchema } from '../dtos/common.dto';

/**
 * Obtiene todas las categorías del tenant autenticado
 */
export const getCategoriasHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const categorias = await categoriaModel.findAllCategoriasByTenant(tenantId);
    res.status(200).json(categorias);
  }
);

/**
 * Crea una nueva categoría para el tenant autenticado
 */
export const createCategoriaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parse = CreateCategoriaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    try {
      const nueva = await categoriaModel.createCategoria(parse.data, tenantId);
      res.status(201).json(nueva);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ message: 'Ya existe una categoría con ese nombre en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear categoría.' });
    }
  }
);

/**
 * Obtiene una categoría específica por id
 */
export const getCategoriaByIdHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const categoria = await categoriaModel.findCategoriaByIdAndTenant(tenantId, parsedId.data.id);
    if (!categoria) {
      res.status(404).json({ message: 'Categoría no encontrada.' });
      return;
    }
    res.status(200).json(categoria);
  }
);

/**
 * Actualiza una categoría por id
 */
export const updateCategoriaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const parse = UpdateCategoriaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }
    try {
      const updated = await categoriaModel.updateCategoriaByIdAndTenant(
        tenantId,
        parsedId.data.id,
        parse.data
      );
      if (!updated) {
        res.status(404).json({ message: 'Categoría no encontrada.' });
        return;
      }
      res.status(200).json(updated);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ message: 'Ya existe una categoría con ese nombre en este tenant.' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar categoría.' });
    }
  }
);

/**
 * Elimina una categoría por id
 */
export const deleteCategoriaHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID inválido', errors: parsedId.error.flatten() });
      return;
    }
    const deleted = await categoriaModel.deleteCategoriaByIdAndTenant(tenantId, parsedId.data.id);
    if (!deleted) {
      res.status(404).json({ message: 'Categoría no encontrada.' });
      return;
    }
    res.status(200).json({ message: 'Categoría eliminada.' });
  }
);
import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as categoriaModel from '../models/categoria.model';

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
    const data = req.body;

    if (!data.nombre) {
      res.status(400).json({ message: 'Nombre es requerido.' });
      return;
    }

    try {
      const nueva = await categoriaModel.createCategoria(data, tenantId);
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
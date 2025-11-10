import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import { IdParamSchema } from '../dtos/common.dto';
import * as reporteModel from '../models/reporte.model';

/**
 * Obtiene el Kardex completo de un producto (Ventas + Compras + Ajustes)
 * GET /api/reportes/kardex/:productoId
 */
export const getKardexCompletoHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parsedId = IdParamSchema.safeParse({ id: req.params.productoId });
    
    if (!parsedId.success) {
      res.status(400).json({ message: 'ID de producto inválido', errors: parsedId.error.flatten() });
      return;
    }

    const kardex = await reporteModel.generarKardexCompleto(tenantId, parsedId.data.id);
    
    if (!kardex) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }

    res.status(200).json(kardex);
  }
);

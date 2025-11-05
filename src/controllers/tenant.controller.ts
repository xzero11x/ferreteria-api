import { type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { type RequestWithAuth } from '../middlewares/auth.middleware';
import * as tenantModel from '../models/tenant.model';
import { TenantConfiguracionSchema } from '../dtos/tenant.dto';
import { Prisma } from '@prisma/client';

// Utilidad simple para mezclar objetos profundamente
const deepMerge = (target: any, source: any): any => {
  const out: any = Array.isArray(target) ? [...target] : { ...(target ?? {}) };
  if (!source || typeof source !== 'object') return out;
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = (target ?? {})[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      out[key] = deepMerge(tgtVal ?? {}, srcVal);
    } else {
      out[key] = srcVal;
    }
  }
  return out;
};

/**
 * GET /api/tenant/configuracion — Obtiene configuración del tenant
 */
export const getTenantConfiguracionHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const tenant = await tenantModel.findTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ message: 'Tenant no encontrado.' });
      return;
    }
    res.status(200).json(tenant.configuracion ?? {});
  }
);

/**
 * PUT /api/tenant/configuracion — Actualiza configuración (merge parcial)
 */
export const updateTenantConfiguracionHandler = asyncHandler(
  async (req: RequestWithAuth, res: Response) => {
    const tenantId = req.tenantId!;
    const parse = TenantConfiguracionSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
      return;
    }

    const tenant = await tenantModel.findTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ message: 'Tenant no encontrado.' });
      return;
    }

    const current = (tenant.configuracion as any) ?? {};
    const merged = deepMerge(current, parse.data) as Prisma.JsonObject;

    const updated = await tenantModel.updateTenantConfiguracionById(tenantId, merged);
    res.status(200).json(updated.configuracion ?? {});
  }
);
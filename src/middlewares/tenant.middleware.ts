import { type Request, type Response, type NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { findTenantBySubdominio } from '../models/tenant.model';

export interface RequestWithTenant extends Request {
    tenantId?: number;
}

/**
 * Middleware para identificar el tenant basado en el subdominio
 */
export const checkTenant = asyncHandler(
    async (req: RequestWithTenant, res: Response, next: NextFunction) => {
        const hostname = req.hostname;
        const parts = hostname.split('.');
        const subdominio = parts[0];

        if (!subdominio || subdominio === 'www' || subdominio === 'localhost') {
            res.status(400).json({ message: 'No se proporcionó un subdominio de tenant.' });
            return;
        }

        const tenant = await findTenantBySubdominio(subdominio);
        
        if (!tenant) {
            res.status(404).json({ message: 'Tenant no válido o inactivo.' });
            return;
        }

        req.tenantId = tenant.id;
        next();
    }
);
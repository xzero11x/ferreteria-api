import { type Request, type Response } from 'express';
import * as tenantModel from '../models/tenant.model';
import * as usuarioModel from '../models/usuario.model';
import { db } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RolUsuario } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { type RequestWithTenant } from '../middlewares/tenant.middleware';
import { RegisterTenantSchema, LoginSchema, VerifyTenantSchema } from '../dtos/auth.dto';

/**
 * Registra un nuevo tenant y su usuario administrador
 */
export const registerTenantHandler = asyncHandler(async (req: Request, res: Response) => {
    const parse = RegisterTenantSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
        return;
    }
    const { nombre_empresa, subdominio, email, password } = parse.data;

    const existingTenant = await tenantModel.findTenantBySubdominio(subdominio);
    if (existingTenant) {
        res.status(409).json({ message: "El subdominio ya está en uso." });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const result = await db.$transaction(async (tx) => {
        const newTenant = await tenantModel.createTenant(
            { nombre_empresa, subdominio },
            tx
        );
        const newAdmin = await usuarioModel.createUsuario(
            { email, password_hash, rol: RolUsuario.admin, nombre: null },
            newTenant.id,
            tx
        );
        return { newTenant, newAdmin };
    });

    // TODO: Implementar envío de email de validación con Resend
    console.log(`TODO: Enviar email de validación a ${email} con Resend.`);
    
    res.status(201).json({
        message: "Tenant registrado exitosamente. Revisa tu email para validar.",
        tenantId: result.newTenant.id
    });
});

/**
 * Autentica un usuario dentro de un tenant específico
 */
export const loginHandler = asyncHandler(async (req: RequestWithTenant, res: Response) => {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
        return;
    }
    const { email, password } = parse.data;
    const tenantId = req.tenantId;

    if (!email || !password || !tenantId) {
        res.status(400).json({ message: "Email, contraseña y subdominio son requeridos." });
        return;
    }

    const usuario = await usuarioModel.findUsuarioByEmailAndTenant(tenantId, email);
    
    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
        res.status(401).json({ message: "Credenciales inválidas." });
        return;
    }

    const jwtPayload = {
        sub: usuario.id,
        tid: usuario.tenant_id,
        rol: usuario.rol
    };

    const token = jwt.sign(
        jwtPayload,
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    res.status(200).json({
        message: "Login exitoso.",
        token: token,
        usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        }
    });
});

/**
 * Verificación manual de tenant (DEV) — activa isActive
 * Solo permitido si TENANT_ACTIVATION_MODE=manual
 * Body admite { tenantId } o { subdominio }
 */
export const verifyTenantHandler = asyncHandler(async (req: Request, res: Response) => {
    const mode = (process.env.TENANT_ACTIVATION_MODE || 'manual').toLowerCase();
    if (mode !== 'manual') {
        res.status(403).json({ message: 'Activación por correo habilitada. Usa verificación por email en producción.' });
        return;
    }

    const parse = VerifyTenantSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parse.error.flatten() });
        return;
    }
    const { tenantId, subdominio } = parse.data;

    let tenant: Awaited<ReturnType<typeof tenantModel.findTenantById>> | null = null;
    if (tenantId) {
        tenant = await tenantModel.findTenantById(Number(tenantId));
    } else if (subdominio) {
        tenant = await tenantModel.findTenantBySubdominio(subdominio);
    }

    if (!tenant) {
        res.status(404).json({ message: 'Tenant no encontrado.' });
        return;
    }

    if (tenant.isActive) {
        res.status(200).json({ message: 'Tenant ya estaba activo.', tenantId: tenant.id });
        return;
    }

    const updated = await tenantModel.activateTenantById(tenant.id);
    res.status(200).json({ message: 'Tenant activado manualmente (DEV).', tenantId: updated.id });
});
import { db } from '../config/db';
import type {
  AperturaSesionCajaDTO,
  CierreSesionCajaDTO,
  SesionCajaResponseDTO,
  SesionActivaResponseDTO,
} from '../dtos/sesion-caja.dto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Modelo de negocio para Sesiones de Caja
 */
class SesionCajaModel {
  /**
   * Abrir una nueva sesión de caja
   */
  async abrirSesion(
    tenantId: number,
    usuarioId: number,
    data: AperturaSesionCajaDTO
  ): Promise<SesionCajaResponseDTO> {
    // Verificar que no exista otra sesión activa para este usuario
    const sesionActiva = await db.sesionesCaja.findFirst({
      where: {
        tenant_id: tenantId,
        usuario_id: usuarioId,
        estado: 'ABIERTA',
      },
    });

    if (sesionActiva) {
      throw new Error('Ya tienes una sesión de caja activa. Debes cerrarla antes de abrir una nueva.');
    }

    // CRÍTICO: Verificar que la CAJA FÍSICA no esté ocupada por OTRO usuario
    // "Un Cajón, Un Responsable" - Estándar de la industria
    const cajaOcupada = await db.sesionesCaja.findFirst({
      where: {
        caja_id: data.caja_id,
        tenant_id: tenantId,
        estado: 'ABIERTA',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (cajaOcupada) {
      const nombreUsuario = cajaOcupada.usuario.nombre || cajaOcupada.usuario.email;
      throw new Error(
        `La caja ya está siendo usada por ${nombreUsuario}. ` +
        `Se requiere cierre administrativo antes de iniciar un nuevo turno. ` +
        `Contacta a un supervisor.`
      );
    }

    // Verificar que la caja exista y esté activa
    const caja = await db.cajas.findFirst({
      where: {
        id: data.caja_id,
        tenant_id: tenantId,
        isActive: true,
      },
    });

    if (!caja) {
      throw new Error('La caja especificada no existe o está inactiva');
    }

    const sesion = await db.sesionesCaja.create({
      data: {
        caja_id: data.caja_id,
        usuario_id: usuarioId,
        monto_inicial: new Decimal(data.monto_inicial),
        estado: 'ABIERTA',
        tenant_id: tenantId,
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.mapSesionToDTO(sesion);
  }

  /**
   * Cerrar una sesión de caja
   */
  async cerrarSesion(
    sesionId: number,
    tenantId: number,
    usuarioId: number,
    data: CierreSesionCajaDTO
  ): Promise<SesionCajaResponseDTO> {
    // Obtener la sesión
    const sesion = await db.sesionesCaja.findFirst({
      where: {
        id: sesionId,
        tenant_id: tenantId,
        usuario_id: usuarioId,
        estado: 'ABIERTA',
      },
    });

    if (!sesion) {
      throw new Error('Sesión no encontrada o ya está cerrada');
    }

    // Calcular totales
    const ventas = await db.ventas.findMany({
      where: {
        sesion_caja_id: sesionId,
        tenant_id: tenantId,
      },
      select: {
        total: true,
      },
    });

    const movimientos = await db.movimientosCaja.findMany({
      where: {
        sesion_caja_id: sesionId,
        tenant_id: tenantId,
      },
      select: {
        tipo: true,
        monto: true,
      },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);

    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    // Calcular monto esperado: monto_inicial + ventas + ingresos - egresos
    const montoEsperado = Number(sesion.monto_inicial) + totalVentas + totalIngresos - totalEgresos;

    // Calcular diferencia
    const diferencia = data.monto_final - montoEsperado;

    // Actualizar sesión
    const sesionActualizada = await db.sesionesCaja.update({
      where: {
        id: sesionId,
      },
      data: {
        fecha_cierre: new Date(),
        monto_final: new Decimal(data.monto_final),
        total_ventas: new Decimal(totalVentas),
        total_egresos: new Decimal(totalEgresos),
        diferencia: new Decimal(diferencia),
        estado: 'CERRADA',
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.mapSesionToDTO(sesionActualizada);
  }

  /**
   * Cierre Administrativo: Permite a un supervisor cerrar la sesión de otro usuario
   * Caso de uso: Usuario dejó sesión abierta y no está disponible para cerrarla
   * 
   * @param sesionId - ID de la sesión a cerrar
   * @param tenantId - ID del tenant
   * @param adminUsuarioId - ID del supervisor/admin que ejecuta el cierre
   * @param data - Datos del cierre (monto final y motivo)
   * @returns Sesión cerrada con auditoría del cierre administrativo
   */
  async cerrarSesionAdministrativo(
    sesionId: number,
    tenantId: number,
    adminUsuarioId: number,
    data: { monto_final: number; motivo: string }
  ): Promise<SesionCajaResponseDTO> {
    // Verificar que la sesión existe y está abierta (SIN validar que sea del admin)
    const sesion = await db.sesionesCaja.findFirst({
      where: {
        id: sesionId,
        tenant_id: tenantId,
        estado: 'ABIERTA',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!sesion) {
      throw new Error('Sesión no encontrada o ya está cerrada');
    }

    // Calcular totales (mismo proceso que cierre normal)
    const ventas = await db.ventas.findMany({
      where: {
        sesion_caja_id: sesionId,
        tenant_id: tenantId,
      },
      select: {
        total: true,
      },
    });

    const movimientos = await db.movimientosCaja.findMany({
      where: {
        sesion_caja_id: sesionId,
        tenant_id: tenantId,
      },
      select: {
        tipo: true,
        monto: true,
      },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const montoEsperado = Number(sesion.monto_inicial) + totalVentas + totalIngresos - totalEgresos;
    const diferencia = data.monto_final - montoEsperado;

    // AUDITORÍA: Registrar información del cierre administrativo
    // Guardamos el motivo en un campo JSON o en tabla de logs
    // Por ahora lo incluimos como comentario para futuro log de auditoría
    const metadataCierre = {
      tipo_cierre: 'ADMINISTRATIVO',
      cerrado_por_admin_id: adminUsuarioId,
      usuario_original_id: sesion.usuario_id,
      usuario_original_nombre: sesion.usuario.nombre || sesion.usuario.email,
      motivo: data.motivo,
      fecha_cierre_admin: new Date().toISOString(),
    };

    // TODO: Guardar metadataCierre en tabla de auditoría cuando se implemente
    console.log('[CIERRE ADMINISTRATIVO]', metadataCierre);

    // Actualizar sesión (mismo proceso que cierre normal)
    const sesionCerrada = await db.sesionesCaja.update({
      where: {
        id: sesionId,
      },
      data: {
        fecha_cierre: new Date(),
        monto_final: new Decimal(data.monto_final),
        total_ventas: new Decimal(totalVentas),
        total_egresos: new Decimal(totalEgresos),
        diferencia: new Decimal(diferencia),
        estado: 'CERRADA',
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.mapSesionToDTO(sesionCerrada);
  }

  /**
   * Obtener sesión activa del usuario
   */
  async getSesionActiva(tenantId: number, usuarioId: number): Promise<SesionActivaResponseDTO> {
    const sesion = await db.sesionesCaja.findFirst({
      where: {
        tenant_id: tenantId,
        usuario_id: usuarioId,
        estado: 'ABIERTA',
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!sesion) {
      return {
        sesion: null,
        tiene_sesion_activa: false,
      };
    }

    return {
      sesion: this.mapSesionToDTO(sesion),
      tiene_sesion_activa: true,
    };
  }

  /**
   * Obtener historial de sesiones
   */
  async getHistorialSesiones(
    tenantId: number,
    cajaId?: number,
    usuarioId?: number,
    limit = 50
  ): Promise<SesionCajaResponseDTO[]> {
    const sesiones = await db.sesionesCaja.findMany({
      where: {
        tenant_id: tenantId,
        ...(cajaId && { caja_id: cajaId }),
        ...(usuarioId && { usuario_id: usuarioId }),
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: {
        fecha_apertura: 'desc',
      },
      take: limit,
    });

    return sesiones.map(this.mapSesionToDTO);
  }

  /**
   * Obtener detalle de una sesión
   */
  async getSesionById(sesionId: number, tenantId: number): Promise<SesionCajaResponseDTO | null> {
    const sesion = await db.sesionesCaja.findFirst({
      where: {
        id: sesionId,
        tenant_id: tenantId,
      },
      include: {
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!sesion) return null;

    return this.mapSesionToDTO(sesion);
  }

  /**
   * Mapear sesión de Prisma a DTO
   */
  private mapSesionToDTO(sesion: any): SesionCajaResponseDTO {
    return {
      id: sesion.id,
      fecha_apertura: sesion.fecha_apertura,
      fecha_cierre: sesion.fecha_cierre,
      monto_inicial: Number(sesion.monto_inicial),
      monto_final: sesion.monto_final ? Number(sesion.monto_final) : null,
      total_ventas: sesion.total_ventas ? Number(sesion.total_ventas) : null,
      total_egresos: sesion.total_egresos ? Number(sesion.total_egresos) : null,
      diferencia: sesion.diferencia ? Number(sesion.diferencia) : null,
      estado: sesion.estado,
      caja_id: sesion.caja_id,
      caja: sesion.caja,
      usuario_id: sesion.usuario_id,
      usuario: sesion.usuario,
      tenant_id: sesion.tenant_id,
    };
  }
}

export default new SesionCajaModel();

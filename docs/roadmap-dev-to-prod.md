# Roadmap Desarrollo → Producción (Ferretería SaaS Multi‑Tenant)

## Objetivo y Alcance
- Garantizar paridad funcional entre desarrollo y producción.
- Minimizar cambios a configuración (env/DNS) para el despliegue en producción.
- Alinear implementación con: `docs/ferreteria-requirements.md`, `docs/multitenant-architecture.md`, `docs/pedidos-reservas-module.md`.

## Referencias
- Requerimientos: `docs/ferreteria-requirements.md`
- Arquitectura Multi‑Tenant: `docs/multitenant-architecture.md`
- Módulo Pedidos/Reservas: `docs/pedidos-reservas-module.md`
- Contrato API actual: `API_Contract.md`

## Principios de Arquitectura
- Multi‑Tenant por subdominio (ej. `central.localhost`, `cliente-a.tudominio.com`).
- Aislamiento por `tenant_id` en todas las tablas de negocio (Prisma/MariaDB).
- JWT con `tid` (tenant_id) y validación de coincidencia con subdominio.
- Middleware de tenant debe rechazar acceso si el tenant no está activo (`isActive=false`).
- Compatibilidad con proxy inverso mediante `trust proxy` y `X-Forwarded-Host` (prod).

## Feature Flags y Variables de Entorno
- `JWT_SECRET`: secreto para firmar JWT.
- `DATABASE_URL`: conexión MariaDB (Prisma usa `provider="mysql"`).
- `EMAIL_ENABLED` (`false|true`): habilita envío de correos (Resend) en producción.
- `TENANT_ACTIVATION_MODE` (`manual|email`): controla activación de tenants.
- `CORS_ORIGINS`: lista separada por comas (ej. `http://localhost:5173,http://*.localhost:5173`).
- `TRUST_PROXY` (`false|true`): habilitar lectura de encabezados de proxy en producción.
- `RESEND_API_KEY`: clave de Resend (solo producción cuando `EMAIL_ENABLED=true`).

### Valores sugeridos por entorno
- Desarrollo: `EMAIL_ENABLED=false`, `TENANT_ACTIVATION_MODE=manual`, `TRUST_PROXY=false`.
- Producción: `EMAIL_ENABLED=true`, `TENANT_ACTIVATION_MODE=email`, `TRUST_PROXY=true`.

## Hitos y Criterios de Aceptación

### Hito 1: Activación de Tenants (sin correo en dev)
- Dev: endpoint `POST /api/auth/verify` que activa `Tenants.isActive = true` (por `tenantId` o token simple).
- Register: devolver “código de verificación dev” si `TENANT_ACTIVATION_MODE=manual`.
- Prod: con `EMAIL_ENABLED=true` y `TENANT_ACTIVATION_MODE=email`, enviar correo de verificación (Resend).
- Aceptación: tenants inactivos no pueden autenticar ni consumir API.

### Hito 2: Validación `isActive` en middleware
- `checkTenant` debe rechazar si `isActive=false` (403).
- Aceptación: todos los endpoints multi‑tenant bloquean acceso para tenants inactivos.

### Hito 3: Roles y autorización por ruta
- Middleware `checkRole(rolesPermitidos: string[])`.
- Reglas sugeridas:
  - Productos: `GET` (`admin|empleado`), `POST` (`admin`).
  - Pedidos/Reservas: `GET/POST` (`admin|empleado`).
  - Inventario (futuro): ajustes `admin`, consulta `empleado`.
  - Compras (futuro): ingreso mercadería según rol.
- Aceptación: peticiones no autorizadas retornan 403.

### Hito 4: CORS (subdominios)
- Dev: mantener `http://localhost:5173`; si se usa `http://central.localhost:5173`, añadir a `CORS_ORIGINS`.
- Prod: `CORS_ORIGINS=https://*.tudominio.com`.
- Aceptación: llamadas desde SPA autorizadas según lista configurable.

### Hito 5: Proxy/Ingress (producción)
- Activar `TRUST_PROXY=true` y leer `X-Forwarded-Host` si el proxy lo envía.
- Aceptación: extracción de subdominio correcta detrás de proxy inverso.

### Hito 6: DTOs y validaciones
- Sustituir `any` por DTOs tipados (ej. creación de producto y acciones de pedidos).
- Validaciones mínimas (campos requeridos, tipos, rangos).
- Aceptación: entradas inválidas retornan 400 con mensajes consistentes.

### Hito 7: Pruebas de integración
- Escenarios:
  - Registro y activación manual de tenant.
  - Login bajo subdominio (`central.localhost`).
  - Productos: listar/crear con roles.
  - Pedidos: listar, confirmar, cancelar, generar venta.
- Aceptación: pruebas pasan en CI local.

### Hito 8: Correo (Resend)
- Servicio `mail.service` que no hace nada si `EMAIL_ENABLED=false`.
- En prod, enviar correos de verificación (tenant) y notificaciones de pedidos.
- Aceptación: correos enviados solo cuando está habilitado.

## Contratos de Endpoints a Implementar (resumen)

### Configuración del Tenant
- `GET /api/tenant/configuracion` → retorna `Tenants.configuracion`.
- `PUT /api/tenant/configuracion` → actualiza branding y parámetros de pedidos.

## Setup de Desarrollo
- Subdominio local:
  - Hosts (Windows): `C:\Windows\System32\drivers\etc\hosts` → `127.0.0.1 central.localhost`.
  - Registrar: `POST http://localhost:3001/api/auth/register` con `{"subdominio":"central"}`.
  - Activar (dev): `POST /api/auth/verify` o vía DB/Prisma Studio.
  - Login y API por tenant: `http://central.localhost:3001/...`.
- CORS:
  - Si frontend corre en `http://localhost:5173`, no cambiar.
  - Si corre en subdominio, añadir `http://*.localhost:5173` a `CORS_ORIGINS`.
- Healthcheck: `GET /api/healthcheck`.

## Checklist de Producción (Cambios mínimos)
- DNS: `*.tudominio.com` apuntando al ingress del backend.
- `.env`:
  - `DATABASE_URL`, `JWT_SECRET`.
  - `EMAIL_ENABLED=true`, `TENANT_ACTIVATION_MODE=email`, `TRUST_PROXY=true`.
  - `CORS_ORIGINS=https://*.tudominio.com`, `RESEND_API_KEY`.
- Migraciones Prisma aplicadas (`prisma migrate`).
- Monitoreo/logs: nivel `warn/error` y trazabilidad de solicitudes por tenant.

## Pruebas (escenarios clave)
- Registro y activación manual de tenant; intento de login con `isActive=false` debe fallar.
- Validación de `tid` en JWT coincide con subdominio en `checkAuth`.
- Pedidos: ciclo completo confirmar/cancelar/generar venta.
- Configuración: `GET/PUT` lectura y actualización de `Tenants.configuracion`.

## Riesgos y Pendientes
- Integraciones externas (Resend, validación identidad de empleados) pospuestas a prod.
- Lectura de subdominio detrás de algunos proxys puede requerir ajuste de encabezados.
- Tipado y validaciones deben consolidarse para evitar `any` y errores de datos.

### Dependencias de Datos (Prisma)
- `PedidoDetalles.producto_id` referencia obligatoria a `Productos`.
- `Pedidos.cliente_id` referencia a `Clientes` (según modelo).
- Vinculación `Ventas.pedido_origen_id` para cerrar el flujo de reserva → venta.
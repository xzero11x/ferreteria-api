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

### Hito 3: API Pedidos/Reservas (mínimo viable)
- Endpoints:
  - `GET /api/pedidos?estado=pendiente|confirmado|cancelado|entregado` (listar por tenant).
  - `GET /api/pedidos/:id` (detalle del pedido con stock actual por producto).
  - `POST /api/pedidos/:id/confirmar` y `POST /api/pedidos/:id/cancelar`.
  - `POST /api/pedidos/:id/generar-venta` (crea `Ventas` con `pedido_origen_id` único).
- Correos: solo se envían si `EMAIL_ENABLED=true` (prod). En dev, se omiten.
- Aceptación: flujos de confirmar/cancelar/generar venta funcionales sin correo en dev.

### Hito 4: Roles y autorización por ruta
- Middleware `checkRole(rolesPermitidos: string[])`.
- Reglas sugeridas:
  - Productos: `GET` (`admin|empleado`), `POST` (`admin`).
  - Pedidos/Reservas: `GET/POST` (`admin|empleado`).
  - Inventario (futuro): ajustes `admin`, consulta `empleado`.
  - Compras (futuro): ingreso mercadería según rol.
- Aceptación: peticiones no autorizadas retornan 403.

### Hito 5: Configuración del Tenant
- `GET /api/tenant/configuracion` y `PUT /api/tenant/configuracion` (solo `admin`).
- Campos en `Tenants.configuracion`:
  - Branding: `logoUrl`, `colorPrimario`, `nombreApp`.
  - Pedidos: `dias_limite_reserva`, `plantillas_email` (confirmación/cancelación).
- Aceptación: frontend puede leer y actualizar configuración por tenant.

### Hito 6: CORS (subdominios)
- Dev: mantener `http://localhost:5173`; si se usa `http://central.localhost:5173`, añadir a `CORS_ORIGINS`.
- Prod: `CORS_ORIGINS=https://*.tudominio.com`.
- Aceptación: llamadas desde SPA autorizadas según lista configurable.

### Hito 7: Proxy/Ingress (producción)
- Activar `TRUST_PROXY=true` y leer `X-Forwarded-Host` si el proxy lo envía.
- Aceptación: extracción de subdominio correcta detrás de proxy inverso.

### Hito 8: DTOs y validaciones
- Sustituir `any` por DTOs tipados (ej. creación de producto y acciones de pedidos).
- Validaciones mínimas (campos requeridos, tipos, rangos).
- Aceptación: entradas inválidas retornan 400 con mensajes consistentes.

### Hito 9: Pruebas de integración
- Escenarios:
  - Registro y activación manual de tenant.
  - Login bajo subdominio (`central.localhost`).
  - Productos: listar/crear con roles.
  - Pedidos: listar, confirmar, cancelar, generar venta.
- Aceptación: pruebas pasan en CI local.

### Hito 10: Correo (Resend)
- Servicio `mail.service` que no hace nada si `EMAIL_ENABLED=false`.
- En prod, enviar correos de verificación (tenant) y notificaciones de pedidos.
- Aceptación: correos enviados solo cuando está habilitado.

## Contratos de Endpoints a Implementar (resumen)

### Pedidos
- `GET /api/pedidos`
  - Query: `estado` opcional.
  - Respuesta: lista con `id`, `estado`, `tipo_recojo`, `cliente`, `created_at`, alerta por vencer según `dias_limite_reserva`.
- `GET /api/pedidos/:id`
  - Respuesta: `detalles[]` con `producto_id`, `cantidad`, `stock_actual`.
- `POST /api/pedidos/:id/confirmar`
  - Body opcional: mensaje al cliente.
  - Respuesta: estado actualizado y, en prod, confirmación de correo.
- `POST /api/pedidos/:id/cancelar`
  - Body: razón de cancelación.
  - Respuesta: estado actualizado y, en prod, confirmación de correo.
- `POST /api/pedidos/:id/generar-venta`
  - Respuesta: venta creada con vínculo `pedido_origen_id`.

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

## Orden Lógico Obligatorio (Cadena de Dependencias)

El desarrollo debe respetar dependencias de datos y arquitectura. No se puede implementar un módulo transaccional si sus módulos maestros no existen.

- Nivel 1: Fundación (Arquitectura y Acceso)
  - Tenants: identificación por subdominio y activación (`isActive`).
  - Usuarios y Roles.
  - Autenticación (Auth): Login/Registro con JWT incluyendo `tid`.

- Nivel 2: Módulos Maestros (Sustantivos)
  - Categorías: organización de productos. Endpoints a definir (`/api/categorias`).
  - Productos: “qué” se vende/compra. Endpoints ya iniciados (`GET/POST /api/productos`).
  - Clientes: “quién” compra. Endpoints a definir (`/api/clientes`).
  - Proveedores: “a quién” compramos. Endpoints a definir (`/api/proveedores`).

- Nivel 3: Módulos Transaccionales (Acciones)
  - Ajustes de Inventario: depende de Productos y Usuarios.
  - Órdenes de Compra: depende de Productos, Proveedores y Usuarios.
  - Ventas (POS): depende de Productos, Clientes y Usuarios.
  - Pedidos y Reservas: depende de Productos y Clientes; se conecta con Ventas para finalizar.

### Dependencias de Datos (Prisma)
- `PedidoDetalles.producto_id` referencia obligatoria a `Productos`.
- `Pedidos.cliente_id` referencia a `Clientes` (según modelo).
- Vinculación `Ventas.pedido_origen_id` para cerrar el flujo de reserva → venta.

### Implicación en el Orden de Hitos
- Podemos introducir “Pedidos/Reservas” temprano porque `Productos` ya existe y el esquema de `PedidoDetalles` referencia `Productos`.
- La extensión de `Clientes` puede ser mínima al inicio (alta básica) para satisfacer las dependencias y evolucionar en paralelo.

### Diagrama de dependencias (Mermaid)

```mermaid
graph TD
  %% Nivel 1 - Fundación
  subgraph Nivel 1 - Fundación
    T[Tenants (subdominio, isActive)]
    U[Usuarios]
    R[Roles]
    A[Auth (JWT con tid)]
    T --> A
    U --> A
    R --> A
  end

  %% Nivel 2 - Maestros
  subgraph Nivel 2 - Maestros
    C[Categorías]
    P[Productos]
    CL[Clientes]
    PR[Proveedores]
    C --> P
  end

  %% Nivel 3 - Transaccionales
  subgraph Nivel 3 - Transaccionales
    AI[Ajustes de Inventario]
    OC[Órdenes de Compra]
    V[Ventas (POS)]
    PE[Pedidos y Reservas]
  end

  %% Dependencias transaccionales
  P --> AI
  U --> AI

  P --> OC
  PR --> OC
  U --> OC

  P --> V
  CL --> V
  U --> V

  P --> PE
  CL --> PE
  PE --> V

  %% Acceso mediante Auth
  A --> AI
  A --> OC
  A --> V
  A --> PE
```

### Diagrama ASCII (fallback)

```
Nivel 1 (Fundación):
  Tenants -> Auth <- Usuarios/Roles

Nivel 2 (Maestros):
  Categorías -> Productos
  Clientes, Proveedores

Nivel 3 (Transaccionales):
  AjustesInventario  <= Productos + Usuarios
  OrdenesCompra      <= Productos + Proveedores + Usuarios
  VentasPOS          <= Productos + Clientes + Usuarios
  PedidosReservas    <= Productos + Clientes  -> VentasPOS
```
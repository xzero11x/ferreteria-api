# API Contract - Ferretería Multi-Tenant

Esta es la documentación oficial de los endpoints del backend de la API de Ferretería.

## Información General

- **Base URL Local**: `http://localhost:3001`
- **Arquitectura**: Multi-tenant basada en subdominios
- **Autenticación**: JWT (JSON Web Tokens)
- **Formato de Respuesta**: JSON
- **Roadmap de Implementación**: ver `docs/roadmap-dev-to-prod.md` para hitos, flags y orden lógico.

---

## 🔐 Módulo: Autenticación (`/api/auth`)

### 1. Registro de Nuevo Tenant

**Endpoint**: `POST /api/auth/register`

**Descripción**: Registra una nueva compañía (Tenant) y su primer usuario administrador.

**Acceso**: Público (No requiere subdominio, no requiere token)

**URL de Prueba**: `http://localhost:3001/api/auth/register`

#### Request Body
```json
{
    "nombre_empresa": "string",
    "subdominio": "string",
    "email": "string (email válido)",
    "password": "string"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
    "message": "Tenant registrado exitosamente. Revisa tu email para validar.",
    "tenantId": 123
}
```

#### Respuestas de Error
- **400 Bad Request**: Si falta algún campo requerido
- **409 Conflict**: Si el subdominio ya existe

---

### 2. Login de Usuario

**Endpoint**: `POST /api/auth/login`

**Descripción**: Autentica a un usuario dentro de un tenant específico.

**Acceso**: Privado por Tenant (Requiere un subdominio válido)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/auth/login`

**Ejemplo**: `http://central.localhost:3001/api/auth/login`

#### Request Body
```json
{
    "email": "string",
    "password": "string"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
    "message": "Login exitoso.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
        "id": 1,
        "email": "admin@empresa.com",
        "rol": "admin"
    }
}
```

#### Respuestas de Error
- **400 Bad Request**: Si falta email/password o el subdominio
- **404 Not Found**: Si el subdominio (tenant) no existe
- **401 Unauthorized**: Si el email o la contraseña son incorrectos

---

## 📦 Módulo: Productos (`/api/productos`)

> **Nota**: Todos los endpoints de productos requieren autenticación JWT y subdominio válido.

### 3. Obtener Todos los Productos

**Endpoint**: `GET /api/productos`

**Descripción**: Obtiene la lista de todos los productos del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/productos`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
[
    {
        "id": 1,
        "nombre": "Martillo",
        "sku": "MAR001",
        "descripcion": "Martillo de acero 500g",
        "precio_venta": "25.50",
        "costo_compra": "15.00",
        "stock": 50,
        "stock_minimo": 5,
        "tenant_id": 1,
        "categoria_id": 2,
        "categoria": {
            "id": 2,
            "nombre": "Herramientas"
        }
    }
]
```

#### Respuestas de Error
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant
- **404 Not Found**: Tenant no existe

---

### 4. Crear Nuevo Producto

**Endpoint**: `POST /api/productos`

**Descripción**: Crea un nuevo producto para el tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/productos`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "nombre": "string (requerido)",
    "sku": "string (opcional, único por tenant)",
    "descripcion": "string (opcional)",
    "precio_venta": "decimal (requerido)",
    "costo_compra": "decimal (opcional)",
    "stock": "integer (requerido)",
    "stock_minimo": "integer (opcional, default: 5)",
    "categoria_id": "integer (opcional)"
}
```

#### Ejemplo de Request
```json
{
    "nombre": "Destornillador Phillips",
    "sku": "DEST001",
    "descripcion": "Destornillador Phillips #2",
    "precio_venta": 12.50,
    "costo_compra": 8.00,
    "stock": 25,
    "stock_minimo": 3,
    "categoria_id": 2
}
```

#### Respuesta Exitosa (201 Created)
```json
{
    "id": 15,
    "nombre": "Destornillador Phillips",
    "sku": "DEST001",
    "descripcion": "Destornillador Phillips #2",
    "precio_venta": "12.50",
    "costo_compra": "8.00",
    "stock": 25,
    "stock_minimo": 3,
    "tenant_id": 1,
    "categoria_id": 2
}
```

#### Respuestas de Error
- **400 Bad Request**: Campos requeridos faltantes o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant
- **409 Conflict**: SKU ya existe para este tenant

---

## 🗂 Módulo: Categorías (`/api/categorias`)

> **Nota**: Todos los endpoints de categorías requieren autenticación JWT y subdominio válido.

### 5. Obtener Todas las Categorías

**Endpoint**: `GET /api/categorias`

**Descripción**: Lista todas las categorías del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/categorias`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
[
  { "id": 2, "nombre": "Herramientas", "descripcion": "" }
]
```

#### Respuestas de Error
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant

### 6. Crear Nueva Categoría

**Endpoint**: `POST /api/categorias`

**Descripción**: Crea una categoría para el tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/categorias`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "nombre": "string (requerido)",
  "descripcion": "string (opcional)"
}
```

#### Respuesta Exitosa (201 Created)
```json
{ "id": 10, "nombre": "Herramientas", "descripcion": null }
```

#### Respuestas de Error
- **400 Bad Request**: Nombre requerido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant
- **409 Conflict**: Ya existe una categoría con ese nombre en este tenant

---

## 👥 Módulo: Clientes (`/api/clientes`)

> **Nota**: Todos los endpoints de clientes requieren autenticación JWT y subdominio válido.

### 7. Obtener Todos los Clientes

**Endpoint**: `GET /api/clientes`

**Descripción**: Lista todos los clientes del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/clientes`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "documento_identidad": "DNI123",
    "email": "juan@example.com"
  }
]
```

#### Respuestas de Error
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant

### 8. Crear Nuevo Cliente

**Endpoint**: `POST /api/clientes`

**Descripción**: Crea un cliente para el tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/clientes`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "nombre": "string (requerido)",
  "documento_identidad": "string (opcional, único por tenant)",
  "email": "string (opcional)",
  "telefono": "string (opcional)",
  "direccion": "string (opcional)"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 5,
  "nombre": "Juan Pérez",
  "documento_identidad": "DNI123",
  "email": "juan@example.com"
}
```

#### Respuestas de Error
- **400 Bad Request**: Nombre requerido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant
- **409 Conflict**: El documento de identidad ya existe en este tenant

---

## 🤝 Módulo: Proveedores (`/api/proveedores`)

> **Nota**: Todos los endpoints de proveedores requieren autenticación JWT y subdominio válido.

### 9. Obtener Todos los Proveedores

**Endpoint**: `GET /api/proveedores`

**Descripción**: Lista todos los proveedores del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/proveedores`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 3,
    "nombre": "Ferretería Suministros SA",
    "ruc_identidad": "20123456789",
    "email": "contacto@suministros.com"
  }
]
```

#### Respuestas de Error
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant

### 10. Crear Nuevo Proveedor

**Endpoint**: `POST /api/proveedores`

**Descripción**: Crea un proveedor para el tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/proveedores`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "nombre": "string (requerido)",
  "ruc_identidad": "string (opcional, único por tenant)",
  "email": "string (opcional)",
  "telefono": "string (opcional)",
  "direccion": "string (opcional)"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 7,
  "nombre": "Ferretería Suministros SA",
  "ruc_identidad": "20123456789",
  "email": "contacto@suministros.com"
}
```

#### Respuestas de Error
- **400 Bad Request**: Nombre requerido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Token no válido para este tenant
- **409 Conflict**: El RUC/identidad ya existe en este tenant

---

## Próximos Endpoints y Orden de Implementación

Este proyecto sigue una cadena de dependencias obligatoria. No se implementan módulos transaccionales sin sus módulos maestros.

### Orden Lógico (Cadena de Dependencias)
- **Nivel 1: Fundación (Arquitectura y Acceso)**
  - Tenants (identificación por subdominio) y activación (`isActive`).
  - Usuarios y Roles.
  - Autenticación (Login/Registro) con JWT (`tid` en payload).

- **Nivel 2: Módulos Maestros (Sustantivos)**
  - Categorías: `GET /api/categorias`, `POST /api/categorias` (existentes; ampliar CRUD después).
  - Productos: `GET /api/productos`, `POST /api/productos` (existentes; ampliar CRUD después).
  - Clientes: `GET /api/clientes`, `POST /api/clientes` (existentes; ampliar CRUD después).
  - Proveedores: `GET /api/proveedores`, `POST /api/proveedores` (existentes; ampliar CRUD después).

- **Nivel 3: Módulos Transaccionales (Acciones)**
  - Ajustes de Inventario: `GET/POST` (depende de Productos y Usuarios).
  - Órdenes de Compra: `GET/POST` (depende de Productos, Proveedores y Usuarios).
  - Ventas (POS): `GET/POST` (depende de Productos, Clientes y Usuarios).
  - Pedidos y Reservas: `GET/POST` (depende de Productos y Clientes; se vincula con Ventas para finalizar).

### Dependencias de Datos Clave
- `PedidoDetalles.producto_id` referencia obligatoria a `Productos` (ver `prisma/schema.prisma`).
- `Pedidos.cliente_id` referencia opcional a `Clientes`.
- `Ventas.pedido_origen_id` vincula la venta generada desde un pedido.

### Enlace a Roadmap
- Para criterios de aceptación, flags de entorno y orden detallado por hito, ver `docs/roadmap-dev-to-prod.md`.


## 🔧 Información Técnica

### Autenticación JWT

El token JWT debe incluirse en el header `Authorization` con el formato:
```
Authorization: Bearer <token>
```

### Estructura del JWT Payload
```json
{
    "sub": "user_id",
    "tid": "tenant_id", 
    "rol": "admin|empleado",
    "iat": 1234567890,
    "exp": 1234567890
}
```

### Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado para este recurso |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto con recurso existente |
| 500 | Internal Server Error - Error del servidor |

### Healthcheck

**Endpoint**: `GET /api/healthcheck`

**Descripción**: Verifica el estado del servidor y la conexión a la base de datos.

**Acceso**: Público

#### Respuesta Exitosa (200 OK)
```json
{
    "status": "ok",
    "message": "Servidor API funcionando y CONECTADO a la Base de Datos!"
}
```

---

## 📝 Notas de Desarrollo

- Todos los endpoints están protegidos por middlewares de seguridad
- La arquitectura multi-tenant garantiza el aislamiento de datos
- Los subdominios son obligatorios para identificar el tenant
- Las contraseñas se almacenan hasheadas con bcrypt
- Los tokens JWT expiran en 24 horas

---

*Última actualización: Noviembre 2024*
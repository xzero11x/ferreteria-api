# API Contract - Ferretería Multi-Tenant

Esta es la documentación oficial de los endpoints del backend de la API de Ferretería.

## Información General

- **Base URL Local**: `http://localhost:3001`
- **Arquitectura**: Multi-tenant basada en subdominios
- **Autenticación**: JWT (JSON Web Tokens)
- **Formato de Respuesta**: JSON

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
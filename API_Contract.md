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

### 4.1. Obtener Producto por ID

**Endpoint**: `GET /api/productos/:id`

**Descripción**: Obtiene un producto específico del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/productos/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
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
    "categoria_id": 2
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Producto no encontrado

---

### 4.2. Actualizar Producto

**Endpoint**: `PUT /api/productos/:id`

**Descripción**: Actualiza los datos de un producto existente.

**Acceso**: Privado (Requiere token JWT, rol admin o empleado)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/productos/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "nombre": "string (opcional)",
    "sku": "string (opcional)",
    "descripcion": "string (opcional)",
    "precio_venta": "decimal (opcional)",
    "costo_compra": "decimal (opcional)",
    "stock": "integer (opcional)",
    "stock_minimo": "integer (opcional)",
    "categoria_id": "integer (opcional)"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Martillo Actualizado",
    "sku": "MAR001",
    "descripcion": "Martillo de acero 500g reforzado",
    "precio_venta": "27.50",
    "costo_compra": "16.00",
    "stock": 45,
    "stock_minimo": 5,
    "tenant_id": 1,
    "categoria_id": 2
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos suficientes
- **404 Not Found**: Producto no encontrado
- **409 Conflict**: SKU duplicado en el tenant

---

### 4.3. Desactivar Producto (Borrado Lógico)

**Endpoint**: `PATCH /api/productos/:id/desactivar`

**Descripción**: Desactiva un producto (borrado lógico). El producto ya no aparecerá en listados pero se mantiene en la base de datos.

**Acceso**: Privado (Requiere token JWT y rol admin únicamente)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/productos/1/desactivar`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "message": "Producto desactivado."
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Producto no encontrado

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

### 6.1. Obtener Categoría por ID

**Endpoint**: `GET /api/categorias/:id`

**Descripción**: Obtiene una categoría específica del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/categorias/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Herramientas",
    "descripcion": "Categoría de herramientas manuales",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Categoría no encontrada

---

### 6.2. Actualizar Categoría

**Endpoint**: `PUT /api/categorias/:id`

**Descripción**: Actualiza los datos de una categoría existente.

**Acceso**: Privado (Requiere token JWT, rol admin o empleado)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/categorias/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "nombre": "string (opcional)",
    "descripcion": "string (opcional)"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Herramientas Actualizadas",
    "descripcion": "Categoría actualizada",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos suficientes
- **404 Not Found**: Categoría no encontrada
- **409 Conflict**: Nombre duplicado en el tenant

---

### 6.3. Desactivar Categoría (Borrado Lógico)

**Endpoint**: `PATCH /api/categorias/:id/desactivar`

**Descripción**: Desactiva una categoría (borrado lógico). La categoría ya no aparecerá en listados pero se mantiene en la base de datos.

**Acceso**: Privado (Requiere token JWT y rol admin únicamente)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/categorias/1/desactivar`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "message": "Categoría desactivada."
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Categoría no encontrada

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

### 8.1. Obtener Cliente por ID

**Endpoint**: `GET /api/clientes/:id`

**Descripción**: Obtiene un cliente específico del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/clientes/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Juan Pérez",
    "documento_identidad": "DNI123",
    "email": "juan@example.com",
    "telefono": "555-1234",
    "direccion": "Calle Principal 123",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Cliente no encontrado

---

### 8.2. Actualizar Cliente

**Endpoint**: `PUT /api/clientes/:id`

**Descripción**: Actualiza los datos de un cliente existente.

**Acceso**: Privado (Requiere token JWT, rol admin o empleado)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/clientes/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "nombre": "string (opcional)",
    "documento_identidad": "string (opcional)",
    "email": "string (opcional)",
    "telefono": "string (opcional)",
    "direccion": "string (opcional)"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Juan Pérez Actualizado",
    "documento_identidad": "DNI123",
    "email": "juanperez@email.com",
    "telefono": "555-5678",
    "direccion": "Nueva Dirección 456",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos suficientes
- **404 Not Found**: Cliente no encontrado
- **409 Conflict**: Documento de identidad duplicado en el tenant

---

### 8.3. Desactivar Cliente (Borrado Lógico)

**Endpoint**: `PATCH /api/clientes/:id/desactivar`

**Descripción**: Desactiva un cliente (borrado lógico). El cliente ya no aparecerá en listados pero se mantiene en la base de datos.

**Acceso**: Privado (Requiere token JWT y rol admin únicamente)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/clientes/1/desactivar`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "message": "Cliente desactivado."
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Cliente no encontrado

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

### 10.1. Obtener Proveedor por ID

**Endpoint**: `GET /api/proveedores/:id`

**Descripción**: Obtiene un proveedor específico del tenant autenticado.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/proveedores/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Ferretería Suministros SA",
    "ruc_identidad": "20123456789",
    "email": "contacto@suministros.com",
    "telefono": "555-9876",
    "direccion": "Av. Industrial 456",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Proveedor no encontrado

---

### 10.2. Actualizar Proveedor

**Endpoint**: `PUT /api/proveedores/:id`

**Descripción**: Actualiza los datos de un proveedor existente.

**Acceso**: Privado (Requiere token JWT, rol admin o empleado)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/proveedores/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "nombre": "string (opcional)",
    "ruc_identidad": "string (opcional)",
    "email": "string (opcional)",
    "telefono": "string (opcional)",
    "direccion": "string (opcional)"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
    "id": 1,
    "nombre": "Ferretería Suministros SA Actualizado",
    "ruc_identidad": "20123456789",
    "email": "nuevoemail@suministros.com",
    "telefono": "555-1111",
    "direccion": "Nueva dirección comercial",
    "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos suficientes
- **404 Not Found**: Proveedor no encontrado
- **409 Conflict**: RUC/identidad duplicado en el tenant

---

### 10.3. Desactivar Proveedor (Borrado Lógico)

**Endpoint**: `PATCH /api/proveedores/:id/desactivar`

**Descripción**: Desactiva un proveedor (borrado lógico). El proveedor ya no aparecerá en listados pero se mantiene en la base de datos.

**Acceso**: Privado (Requiere token JWT y rol admin únicamente)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/proveedores/1/desactivar`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
    "message": "Proveedor desactivado."
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Proveedor no encontrado

---

## 💰 Módulo: Ventas (POS) (`/api/ventas`)

> **Nota**: Todos los endpoints de ventas requieren autenticación JWT y subdominio válido.

### 11. Obtener Todas las Ventas

**Endpoint**: `GET /api/ventas`

**Descripción**: Lista todas las ventas del tenant con filtros opcionales.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/ventas`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters** (opcionales):
- `cliente_id`: Filtrar por ID de cliente
- `fecha_inicio`: Filtrar desde fecha (ISO 8601)
- `fecha_fin`: Filtrar hasta fecha (ISO 8601)

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "total": 150.50,
    "metodo_pago": "efectivo",
    "created_at": "2025-11-04T10:30:00.000Z",
    "cliente": { "id": 5, "nombre": "Juan Pérez" },
    "usuario": { "id": 1, "nombre": "Admin User" }
  }
]
```

### 12. Obtener Detalle de Venta

**Endpoint**: `GET /api/ventas/:id`

**Descripción**: Obtiene el detalle completo de una venta específica.

**Acceso**: Privado (Requiere token JWT y subdominio)

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "total": 150.50,
  "metodo_pago": "efectivo",
  "created_at": "2025-11-04T10:30:00.000Z",
  "cliente": { "id": 5, "nombre": "Juan Pérez", "email": "juan@example.com" },
  "usuario": { "id": 1, "nombre": "Admin User" },
  "pedido_origen": { "id": 10, "estado": "confirmado", "tipo_recojo": "tienda" },
  "detalles": [
    {
      "id": 1,
      "producto_id": 3,
      "producto_nombre": "Martillo",
      "producto_sku": "MAR-001",
      "cantidad": 2,
      "precio_unitario": 50.25,
      "subtotal": 100.50
    }
  ]
}
```

### 13. Crear Nueva Venta (POS)

**Endpoint**: `POST /api/ventas`

**Descripción**: Crea una nueva venta, descuenta stock automáticamente.

**Acceso**: Privado (Requiere rol `admin` o `empleado`)

**Roles Permitidos**: `admin`, `empleado`

#### Request Body
```json
{
  "cliente_id": 5,
  "metodo_pago": "efectivo",
  "detalles": [
    {
      "producto_id": 3,
      "cantidad": 2,
      "precio_unitario": 50.25
    }
  ]
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 1,
  "total": 100.50,
  "metodo_pago": "efectivo",
  "created_at": "2025-11-04T10:30:00.000Z"
}
```

#### Respuestas de Error
- **400 Bad Request**: Datos inválidos
- **404 Not Found**: Producto no encontrado
- **409 Conflict**: Stock insuficiente

---

## � Módulo: Usuarios (`/api/usuarios`)

> **Nota**: Todos los endpoints de usuarios requieren autenticación JWT, subdominio válido y **rol de admin únicamente**.

### 13.1. Obtener Todos los Usuarios

**Endpoint**: `GET /api/usuarios`

**Descripción**: Lista todos los usuarios (empleados) activos del tenant autenticado.

**Acceso**: Privado (Requiere token JWT, subdominio y rol admin)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/usuarios`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "email": "admin@empresa.com",
    "nombre": "Administrador Principal",
    "rol": "admin",
    "isActive": true,
    "tenant_id": 1
  },
  {
    "id": 2,
    "email": "empleado1@empresa.com",
    "nombre": "Juan Empleado",
    "rol": "empleado",
    "isActive": true,
    "tenant_id": 1
  }
]
```

#### Respuestas de Error
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin o token no válido para este tenant

---

### 13.2. Crear Nuevo Usuario

**Endpoint**: `POST /api/usuarios`

**Descripción**: Crea un nuevo usuario (empleado o admin) para el tenant autenticado.

**Acceso**: Privado (Requiere token JWT, subdominio y rol admin)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/usuarios`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "string (requerido, email válido)",
  "password": "string (requerido, mínimo 6 caracteres)",
  "rol": "admin | empleado (requerido)",
  "nombre": "string (opcional)"
}
```

#### Ejemplo de Request
```json
{
  "email": "nuevo@empresa.com",
  "password": "password123",
  "rol": "empleado",
  "nombre": "Nuevo Empleado"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 3,
  "email": "nuevo@empresa.com",
  "nombre": "Nuevo Empleado",
  "rol": "empleado"
}
```

#### Respuestas de Error
- **400 Bad Request**: Campos requeridos faltantes o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **409 Conflict**: El email ya existe en este tenant

---

### 13.3. Obtener Usuario por ID

**Endpoint**: `GET /api/usuarios/:id`

**Descripción**: Obtiene un usuario específico del tenant autenticado.

**Acceso**: Privado (Requiere token JWT, subdominio y rol admin)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/usuarios/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "email": "admin@empresa.com",
  "nombre": "Administrador Principal",
  "rol": "admin",
  "isActive": true,
  "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Usuario no encontrado

---

### 13.4. Actualizar Usuario

**Endpoint**: `PUT /api/usuarios/:id`

**Descripción**: Actualiza los datos de un usuario existente.

**Acceso**: Privado (Requiere token JWT, subdominio y rol admin)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/usuarios/1`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "string (opcional)",
  "password": "string (opcional, mínimo 6 caracteres)",
  "rol": "admin | empleado (opcional)",
  "nombre": "string (opcional)"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "email": "admin_actualizado@empresa.com",
  "nombre": "Admin Actualizado",
  "rol": "admin",
  "isActive": true,
  "tenant_id": 1
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido o datos inválidos
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin
- **404 Not Found**: Usuario no encontrado
- **409 Conflict**: Email duplicado en el tenant

---

### 13.5. Desactivar Usuario (Borrado Lógico)

**Endpoint**: `PATCH /api/usuarios/:id/desactivar`

**Descripción**: Desactiva un usuario (borrado lógico). El usuario ya no podrá iniciar sesión y no aparecerá en listados.

**Acceso**: Privado (Requiere token JWT, subdominio y rol admin)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/usuarios/2/desactivar`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "message": "Usuario desactivado."
}
```

#### Respuestas de Error
- **400 Bad Request**: ID inválido
- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario no es admin o intenta desactivarse a sí mismo
- **404 Not Found**: Usuario no encontrado

**Nota importante**: Un usuario admin no puede desactivarse a sí mismo como medida de seguridad.

---

## �📦 Módulo: Inventario (`/api/inventario`)

> **Nota**: Todos los endpoints de inventario requieren autenticación JWT y subdominio válido.

### 14. Obtener Ajustes de Inventario

**Endpoint**: `GET /api/inventario/ajustes`

**Descripción**: Lista todos los ajustes de inventario del tenant con filtros opcionales.

**Acceso**: Privado (Requiere token JWT y subdominio)

**Query Parameters** (opcionales):
- `producto_id`: Filtrar por ID de producto
- `tipo`: Filtrar por tipo (`entrada` o `salida`)
- `fecha_inicio`: Filtrar desde fecha (ISO 8601)
- `fecha_fin`: Filtrar hasta fecha (ISO 8601)

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "tipo": "entrada",
    "cantidad": 50,
    "motivo": "Compra inicial de inventario",
    "created_at": "2025-11-04T09:00:00.000Z",
    "producto": {
      "id": 3,
      "nombre": "Martillo",
      "sku": "MAR-001",
      "stock_actual": 100
    },
    "usuario": { "id": 1, "nombre": "Admin User" }
  }
]
```

### 15. Crear Ajuste de Inventario

**Endpoint**: `POST /api/inventario/ajustes`

**Descripción**: Crea un ajuste de inventario (entrada o salida). Actualiza el stock automáticamente.

**Acceso**: Privado (Requiere rol `admin`)

**Roles Permitidos**: `admin`

#### Request Body
```json
{
  "producto_id": 3,
  "tipo": "entrada",
  "cantidad": 50,
  "motivo": "Ajuste por inventario físico"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 1,
  "tipo": "entrada",
  "cantidad": 50,
  "motivo": "Ajuste por inventario físico",
  "created_at": "2025-11-04T09:00:00.000Z",
  "producto_id": 3
}
```

#### Respuestas de Error
- **404 Not Found**: Producto no encontrado
- **409 Conflict**: Stock insuficiente para salida

---

## 🛒 Módulo: Órdenes de Compra (`/api/compras`)

> **Nota**: Todos los endpoints de compras requieren autenticación JWT y subdominio válido.

### 17. Obtener Todas las Órdenes de Compra

**Endpoint**: `GET /api/compras`

**Descripción**: Lista todas las órdenes de compra del tenant con filtros opcionales.

**Acceso**: Privado (Requiere token JWT y subdominio)

**Query Parameters** (opcionales):
- `proveedor_id`: Filtrar por ID de proveedor
- `estado`: Filtrar por estado (`pendiente`, `recibida`, `cancelada`)
- `fecha_inicio`: Filtrar desde fecha (ISO 8601)
- `fecha_fin`: Filtrar hasta fecha (ISO 8601)

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "total": 500.00,
    "estado": "pendiente",
    "fecha_creacion": "2025-11-03T14:00:00.000Z",
    "fecha_recepcion": null,
    "proveedor": {
      "id": 2,
      "nombre": "Ferretería Suministros SA",
      "ruc_identidad": "20123456789"
    },
    "usuario": { "id": 1, "nombre": "Admin User" }
  }
]
```

### 18. Obtener Detalle de Orden de Compra

**Endpoint**: `GET /api/compras/:id`

**Descripción**: Obtiene el detalle completo de una orden de compra.

**Acceso**: Privado (Requiere token JWT y subdominio)

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "total": 500.00,
  "estado": "pendiente",
  "fecha_creacion": "2025-11-03T14:00:00.000Z",
  "fecha_recepcion": null,
  "proveedor": {
    "id": 2,
    "nombre": "Ferretería Suministros SA",
    "ruc_identidad": "20123456789",
    "email": "contacto@suministros.com",
    "telefono": "123456789"
  },
  "usuario": { "id": 1, "nombre": "Admin User" },
  "detalles": [
    {
      "id": 1,
      "producto_id": 3,
      "producto_nombre": "Martillo",
      "producto_sku": "MAR-001",
      "stock_actual": 50,
      "cantidad": 100,
      "costo_unitario": 5.00,
      "subtotal": 500.00
    }
  ]
}
```

### 19. Crear Orden de Compra

**Endpoint**: `POST /api/compras`

**Descripción**: Crea una nueva orden de compra a proveedor.

**Acceso**: Privado (Requiere rol `admin`)

**Roles Permitidos**: `admin`

#### Request Body
```json
{
  "proveedor_id": 2,
  "detalles": [
    {
      "producto_id": 3,
      "cantidad": 100,
      "costo_unitario": 5.00
    }
  ]
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "id": 1,
  "total": 500.00,
  "estado": "pendiente",
  "fecha_creacion": "2025-11-03T14:00:00.000Z"
}
```

### 20. Recibir Orden de Compra (Ingreso de Mercadería)

**Endpoint**: `POST /api/compras/:id/recibir`

**Descripción**: Registra la recepción de mercadería. Actualiza el stock automáticamente y cambia estado a "recibida".

**Acceso**: Privado (Requiere rol `admin` o `empleado` - almacenero)

**Roles Permitidos**: `admin`, `empleado`

#### Request Body (opcional)
```json
{
  "fecha_recepcion": "2025-11-04T10:00:00.000Z"
}
```

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "estado": "recibida",
  "fecha_recepcion": "2025-11-04T10:00:00.000Z",
  "message": "Orden recibida exitosamente. El stock de los productos ha sido actualizado."
}
```

#### Respuestas de Error
- **404 Not Found**: Orden no encontrada
- **409 Conflict**: Solo se pueden recibir órdenes pendientes

### 21. Cancelar Orden de Compra

**Endpoint**: `POST /api/compras/:id/cancelar`

**Descripción**: Cancela una orden de compra pendiente.

**Acceso**: Privado (Requiere rol `admin`)

**Roles Permitidos**: `admin`

#### Respuesta Exitosa (200 OK)
```json
{
  "id": 1,
  "estado": "cancelada",
  "message": "Orden cancelada exitosamente."
}
```

---

## 📋 Módulo: Pedidos y Reservas (`/api/pedidos`)

> **Nota**: Todos los endpoints de pedidos requieren autenticación JWT y subdominio válido.

### 22. Obtener Todos los Pedidos

**Endpoint**: `GET /api/pedidos`

**Descripción**: Lista todos los pedidos del tenant con filtros opcionales.

**Acceso**: Privado (Requiere token JWT y subdominio)

**Query Parameters** (opcionales):
- `estado`: Filtrar por estado (`pendiente`, `confirmado`, `cancelado`, `entregado`)

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": 1,
    "estado": "pendiente",
    "tipo_recojo": "tienda",
    "created_at": "2025-11-02T08:00:00.000Z",
    "cliente": { "id": 5, "nombre": "Juan Pérez" },
    "alerta_por_vencer": false
  }
]
```

### 23. Confirmar Pedido

**Endpoint**: `POST /api/pedidos/:id/confirmar`

**Descripción**: Cambia el estado del pedido a "confirmado".

**Acceso**: Privado (Requiere rol `admin` o `empleado`)

**Roles Permitidos**: `admin`, `empleado`

#### Request Body (opcional)
```json
{
  "mensaje": "Su pedido está listo para recoger"
}
```

### 24. Generar Venta desde Pedido

**Endpoint**: `POST /api/pedidos/:id/generar-venta`

**Descripción**: Crea una venta en el sistema POS desde un pedido confirmado. Vincula la venta con el pedido y descuenta stock.

**Acceso**: Privado (Requiere rol `admin` o `empleado`)

**Roles Permitidos**: `admin`, `empleado`

#### Request Body (opcional)
```json
{
  "metodo_pago": "efectivo"
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "venta_id": 15,
  "pedido_id": 1,
  "total": 100.50,
  "metodo_pago": "efectivo",
  "created_at": "2025-11-04T11:00:00.000Z"
}
```

---

## ⚙️ Módulo: Configuración del Tenant (`/api/tenant`)

### 25. Obtener Configuración del Tenant

**Endpoint**: `GET /api/tenant/configuracion`

**Descripción**: Obtiene la configuración personalizada del tenant (branding, parámetros).

**Acceso**: Privado (Requiere token JWT y subdominio)

#### Respuesta Exitosa (200 OK)
```json
{
  "branding": {
    "logoUrl": "https://cdn.example.com/logo.png",
    "colorPrimario": "#3B82F6",
    "nombreApp": "Mi Ferretería"
  },
  "pedidos": {
    "dias_limite_reserva": 3
  }
}
```

### 26. Actualizar Configuración del Tenant

**Endpoint**: `PUT /api/tenant/configuracion`

**Descripción**: Actualiza la configuración del tenant (merge parcial).

**Acceso**: Privado (Requiere rol `admin`)

**Roles Permitidos**: `admin`

#### Request Body
```json
{
  "branding": {
    "logoUrl": "https://cdn.example.com/new-logo.png",
    "colorPrimario": "#10B981"
  },
  "pedidos": {
    "dias_limite_reserva": 5
  }
}
```

---

## 📊 Resumen de Implementación

### Estado de Módulos

**✅ Nivel 1: Fundación (100% Completo)**
- Multi-Tenant con subdominio
- Autenticación JWT con `tid`
- Roles y permisos
- Activación manual de tenants (desarrollo)

**✅ Nivel 2: Módulos Maestros (100% Completo)**
- Productos (CRUD completo con roles)
- Categorías (CRUD completo con roles)
- Clientes (CRUD completo)
- Proveedores (CRUD completo)

**✅ Nivel 3: Módulos Transaccionales (100% Completo)**
- Pedidos y Reservas (con generar venta)
- Ventas (POS) (con descuento automático de stock)
- Ajustes de Inventario (con kardex)
- Órdenes de Compra (con recepción de mercadería)

**✅ Configuración (100% Completo)**
- Configuración de tenant (branding y parámetros)
- .env.example documentado
- Healthcheck

### Total de Endpoints Implementados

**~50+ endpoints funcionales** distribuidos en:
- Autenticación: 3 endpoints
- Productos: 5 endpoints
- Categorías: 5 endpoints
- Clientes: 5 endpoints
- Proveedores: 5 endpoints
- Ventas (POS): 5 endpoints
- Inventario: 5 endpoints
- Órdenes de Compra: 7 endpoints
- Pedidos/Reservas: 5 endpoints
- Configuración Tenant: 2 endpoints
- Healthcheck: 1 endpoint


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

## 📊 Módulo: Reportes (`/api/reportes`)

> **Nota**: Todos los endpoints de reportes requieren autenticación JWT y subdominio válido.

### Obtener Kardex Completo de Producto

**Endpoint**: `GET /api/reportes/kardex/:productoId`

**Descripción**: Genera el Kardex completo de un producto, incluyendo **todos los movimientos de inventario**: ventas (salidas), compras recibidas (entradas) y ajustes manuales (entradas/salidas). Calcula el saldo acumulado en cada momento histórico.

**Acceso**: Privado (Requiere token JWT y subdominio)

**URL de Prueba**: `http://[subdominio].localhost:3001/api/reportes/kardex/5`

**Headers Requeridos**:
```
Authorization: Bearer <jwt_token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "producto": {
    "id": 5,
    "nombre": "Martillo",
    "sku": "MAR-001",
    "stock": 95
  },
  "stockActual": 95,
  "totalMovimientos": 8,
  "movimientos": [
    {
      "fecha": "2025-11-01T10:00:00.000Z",
      "tipo": "compra",
      "cantidad": 100,
      "referencia": "Compra #12 - Ferretería Global S.A.",
      "precio_unitario": 15.50,
      "saldo": 100
    },
    {
      "fecha": "2025-11-02T14:30:00.000Z",
      "tipo": "venta",
      "cantidad": 5,
      "referencia": "Venta #45 - Juan Pérez",
      "precio_unitario": 25.00,
      "saldo": 95
    },
    {
      "fecha": "2025-11-03T09:15:00.000Z",
      "tipo": "ajuste_salida",
      "cantidad": 2,
      "referencia": "Ajuste manual",
      "motivo": "Producto dañado en almacén",
      "responsable": "María García",
      "saldo": 93
    },
    {
      "fecha": "2025-11-04T16:00:00.000Z",
      "tipo": "ajuste_entrada",
      "cantidad": 2,
      "referencia": "Ajuste manual",
      "motivo": "Corrección de inventario físico",
      "responsable": "Carlos López",
      "saldo": 95
    }
  ]
}
```

#### Tipos de Movimiento
- **`venta`**: Salida por venta a cliente (incluye nombre del cliente y precio de venta)
- **`compra`**: Entrada por recepción de orden de compra (incluye proveedor y costo)
- **`ajuste_entrada`**: Entrada manual por ajuste de inventario (incluye motivo y responsable)
- **`ajuste_salida`**: Salida manual por ajuste de inventario (incluye motivo y responsable)

#### Campos del Movimiento
- **`fecha`**: Fecha y hora del movimiento (ISO 8601)
- **`tipo`**: Tipo de movimiento (venta | compra | ajuste_entrada | ajuste_salida)
- **`cantidad`**: Cantidad de unidades del movimiento
- **`referencia`**: Descripción del movimiento (ID y contexto)
- **`precio_unitario`**: Precio o costo unitario (solo para ventas y compras)
- **`motivo`**: Razón del ajuste (solo para ajustes manuales)
- **`responsable`**: Usuario que realizó el ajuste (solo para ajustes manuales)
- **`saldo`**: Stock acumulado después de este movimiento

#### Respuestas de Error
- **400 Bad Request**: ID de producto inválido
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Producto no encontrado

#### Notas Importantes
- Solo se incluyen **compras recibidas** (estado `recibida`), las pendientes o canceladas no afectan el inventario
- Los movimientos están ordenados **cronológicamente** del más antiguo al más reciente
- El `saldo` permite auditar el stock en cualquier momento histórico
- Este endpoint reemplaza el anterior `/api/inventario/kardex/:productoId` que solo mostraba ajustes manuales

---

### 🗑️ Borrado Lógico (Soft Delete)

Los siguientes módulos maestros implementan **borrado lógico** mediante el campo `isActive`:

- **Productos** (`/api/productos/:id/desactivar`)
- **Categorías** (`/api/categorias/:id/desactivar`)
- **Clientes** (`/api/clientes/:id/desactivar`)
- **Proveedores** (`/api/proveedores/:id/desactivar`)
- **Usuarios** (`/api/usuarios/:id/desactivar`)

**Características del borrado lógico:**
- Los registros desactivados (`isActive: false`) no aparecen en los listados GET
- Los datos se mantienen en la base de datos para auditoría e integridad referencial
- Solo usuarios con rol **admin** pueden desactivar registros
- El endpoint de desactivación usa el método `PATCH` con la ruta `/:id/desactivar`
- Los usuarios desactivados no pueden iniciar sesión (validación en `/api/auth/login`)
- Un usuario admin no puede desactivarse a sí mismo

---

*Última actualización: 9 de Noviembre 2025 - Módulo de Reportes con Kardex Completo implementado*

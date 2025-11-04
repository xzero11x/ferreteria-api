# Documento Base: Arquitectura Multi-Tenant Estándar

## 1. Propósito y Alcance

Este documento define la arquitectura técnica y los estándares de desarrollo para todos los proyectos multi-inquilino (multi-tenant).

Un "Tenant" es una entidad cliente que consume la aplicación. Cada tenant tendrá su propia configuración, datos y personalización (logos, productos, blogs, etc.), pero compartirá la misma infraestructura de backend y base de datos.

## 2. Stack Tecnológico Aprobado

Todo el desarrollo se adherirá estrictamente al siguiente stack:

- **Lenguaje:** TypeScript (en modo strict en tsconfig.json).
- **Frontend:** React (v18+) con Hooks y arquitectura basada en componentes.
- **Bundler (Frontend):** Vite.
- **Estilos (Frontend):** Tailwind CSS v4.
- **Backend:** Node.js (LTS) con Express.js.
- **Base de Datos:** MariaDB.
- **ORM/Query Builder:** Prisma, TypeORM o Knex.js.

## 3. Arquitectura General (Cliente-Servidor)

La arquitectura sigue un modelo cliente-servidor desacoplado:

- **Cliente (Frontend):** Una Aplicación de Página Única (SPA) construida en React. Es "agnóstica" del tenant; solo consume datos.
- **Servidor (Backend):** Una API RESTful construida en Node.js/Express.js, que sigue el patrón MVC (Modelo-Vista-Controlador).

## 4. Diseño del Backend (API REST - MVC)

El backend manejará toda la lógica de negocio y la identificación del tenant.

- **Modelo:** Representa la lógica de datos (interacción con MariaDB). Todas las consultas deben estar aisladas por Tenant.
- **Vista:** Las respuestas JSON de la API REST.
- **Controlador:** Maneja las rutas (endpoints), valida la entrada (request) y orquesta la lógica de negocio, llamando a los modelos y devolviendo la vista (JSON).

## 5. Estrategia Multi-Tenant

Adoptar un enfoque de Base de Datos Compartida con Discriminador de Tenant.

### 5.1. Identificación del Tenant

La API debe identificar al tenant en cada solicitud entrante. El método preferido es mediante subdominio.

- `cliente-a.nuestra-app.com` -> Identifica al tenant_id = 1
- `cliente-b.nuestra-app.com` -> Identifica al tenant_id = 2

### 5.2. Middleware de Identificación (Express.js)

Se debe crear un middleware global en Express.js que se ejecute antes que cualquier controlador de ruta.

**Lógica del Middleware:**

1. Extraer el subdominio.
2. Consultar la "Tabla Maestra de Tenants" (ver 5.3) para encontrar un tenant activo que coincida con ese subdominio.
3. Si no se encuentra: Devolver un error 404 o 403 (Tenant no válido).
4. Si se encuentra: Adjuntar el ID del tenant al objeto request para uso posterior.

### 5.3. Modelo de Datos (MariaDB)

Adoptar un esquema compartido. Todos los tenants usan las mismas tablas, pero los datos están separados por una columna tenant_id.

#### A. Tabla Maestra (Datos Globales)

Habrá una tabla "maestra" (o base de datos "global") que gestiona qué tenants existen. Esta tabla NO lleva tenant_id, Ejemplo:

```sql
CREATE TABLE Tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    subdominio VARCHAR(100) NOT NULL UNIQUE,
    isActive BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Columna JSON para personalización (Logos, Colores)
    configuracion JSON
);
```

#### B. Tablas de Negocio (Datos Aislados)

Todas las demás tablas que contienen datos específicos del cliente (Productos, Blogs, Usuarios, etc) DEBEN tener una columna tenant_id y una clave foránea que apunte a la tabla Tenants, Ejemplo:

```sql
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL, -- El Discriminador
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- ... otros campos
    
    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email) -- El email es único POR TENANT
);
```

## 6. Diseño del Frontend (React)

El frontend (construido con Vite y React) es una SPA. No debe gestionar la lógica de qué tenant es.

### 6.1. Configuración de API

El frontend simplemente hace llamadas a la API. Dado que la API se sirve en el mismo dominio (bajo diferentes subdominios), las llamadas pueden ser relativas (`/api/productos`).

### 6.2. Personalización y "Branding" (Logo, Colores, etc)

El frontend debe realizar una llamada inicial para obtener la configuración de personalización.

1. El backend expondrá un endpoint global.
2. Este controlador buscará el tenant en la Tenants y devolverá el contenido de la columna configuracion (JSON).
3. Respuesta (ejemplo):

```json
{
    "logoUrl": "https://cdn.cliente-a.com/logo.png",
    "colorPrimario": "#3B82F6",
    "nombreApp": "App de Cliente A"
}
```

4. El frontend (React) usará esta información para aplicar el tema de Tailwind y mostrar el logo correcto.

## 7. Autenticación y Autorización

1. **Login:** El usuario (ej. user@cliente-a.com) intenta iniciar sesión en cliente-a.nuestra-app.com.
2. **Backend:**
   - El middleware identifica tenant_id = 1 (de "cliente-a").
   - El controlador de login busca en la tabla Usuarios con: `WHERE email = 'user@cliente-a.com' AND tenant_id = 1`.
   - Si las credenciales son correctas, se genera un JWT.
3. **JWT Payload:** El payload del JWT DEBE incluir el tenant_id además del user_id.

```json
{
  "sub": "user-uuid-123", 
  "tid": 1,                 
  "iat": 1678886400
}
```

4. **Autorización:** En cada solicitud subsecuente, el middleware que valida el JWT debe verificar que el tid (tenant_id) del token coincide con el tenant_id identificado por el subdominio. Esto evita que un usuario del "Cliente A" use su token para acceder a datos en el subdominio del "Cliente B".
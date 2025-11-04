# Documento de Requerimientos Bases: Proyecto Ferretería

## 1. Adherencia a la Arquitectura Estándar

El proyecto se adhiere estrictamente a la arquitectura base.

- **Infraestructura:** Se usará el stack aprobado (React, Node.js, MariaDB).
- **Aislamiento de Datos:** Todos los datos (productos, ventas, proveedores, etc.) deben estar aislados usando la columna tenant_id en cada tabla de negocio.
- **Identificación:** El acceso al panel será por subdominio (ej. ferreteria-central.ferreteria.com).
- **Autenticación:** Se usará JWT con tid (tenant_id) en el payload.

## 2. Plataforma Global y Registro de Tenants

Esta sección define el portal de la plataforma y el proceso de alta de nuevos clientes (tenants).

### Dominio Base (Portal DEMO)

- El dominio principal (ej. ferreteria.com) funcionará como un "DEMO" o landing page del servicio SaaS.
- Mostrará información genérica (placeholders) sobre las funcionalidades del sistema (Control de Inventario, POS, Gestión de Compras).

### Registro de Nuevos Tenants

- El dominio base debe incluir un formulario de registro para nuevos tenants.
- **Campos Requeridos:**
  - Nombre de la Compañía (Ferretería)
  - Subdominio deseado
  - Email (del administrador del tenant)
  - Contraseña

### Validación de Cuentas (Servicio Externo)

- El proceso de registro debe utilizar Resend para el envío de correos electrónicos transaccionales.
- Se debe enviar un código de validación al email registrado. La cuenta del tenant no se considerará activa hasta que se valide dicho código.

## 3. Módulo Único: Panel Administrativo del Tenant

El sistema consistirá en un único módulo de "Panel Administrativo" que centraliza todas las funcionalidades. Este panel debe incluir los siguientes submódulos:

### 3.1. Dashboard (Panel Principal)

### 3.2. Módulo de Catálogo

- Gestión de Productos
- Gestión de Categorías

### 3.3. Módulo de Inventario (Gestión de Stock)

- Control de Stock
- Ajustes de Inventario
- Reporte de Alertas de Stock
- Kardex de Producto

### 3.4. Módulo de Compras (Adquisiciones)

- Gestión de Proveedores
- Órdenes de Compra (PO)
- Ingreso de Mercadería
- Cuentas por Pagar

### 3.5. Módulo de Ventas (Punto de Venta - POS)

- Interfaz de Venta (Caja)
- Gestión de Clientes
- Registro de Venta
- Emisión de Comprobantes

### 3.6. Módulo de Reportes

- Reporte de Ventas
- Reporte de Inventario Valorizado
- Reporte de Compras
- Reporte de Ganancias

### 3.7. Módulo de Configuración (Administración del Tenant)

- **Gestión de Empleados**
- **Gestión del Panel Administrativo (Branding):**
  - Submódulo para que el Administrador personalice su panel.
  - Funcionalidad: Subir Logo, seleccionar color primario, definir nombre del negocio.
- **Configuración General:**
  - Datos de la empresa (Dirección, Teléfono, RUC/ID Fiscal) que aparecerán en las Notas de Venta.

### 3.8. Gestión de Acceso (Roles)

- **Módulo de Administración**
- **Módulo para Empleado:**
  - Rol "Empleado" (o Vendedor/Almacenero).
  - Acceso restringido únicamente a:
    - **Ventas (POS):** Para registrar ventas.
    - **Compras:** Solo para "Ingreso de Mercadería" (si es Almacenero).
    - **Inventario:** Solo para consultar stock (no puede hacer ajustes).

## 4. Casos Específicos y Requerimientos de Integración

### Validación de Empleados (Servicio Externo)

- En el módulo de "Gestión de Empleados", al registrar un nuevo usuario, el sistema debe conectarse a una API externa (tipo RENIEC o similar) para validar y/o autocompletar los datos de identidad.

### Servicio de Correo (Resend)

- Se reitera que Resend es la herramienta obligatoria para todos los envíos de correo del sistema (validación de registro del tenant, recuperación de contraseñas de empleados).
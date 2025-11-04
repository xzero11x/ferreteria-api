# Nuevo Submódulo: Módulo de Pedidos y Reservas

Este módulo gestionará las solicitudes de los clientes generadas desde el sitio web público del tenant.

## Listado de Pedidos Pendientes

Vista principal para el administrador/empleado donde se listan todas las solicitudes de productos (reservas) generadas.

- Debe mostrar: Cliente, Fecha de Solicitud, Estado (Pendiente, Confirmado, Cancelado, Entregado), Tipo de Recojo (En Tienda o Envío).
- Debe mostrar una alerta visual si el límite de días configurado para la reserva está por vencer.

## Detalle del Pedido

Vista que muestra la lista de productos solicitados, la cantidad y el stock actual del producto.

## Acciones sobre el Pedido

- **Confirmar:** Cambia el estado a "Confirmado". Notifica al cliente (usando Resend) que su pedido está listo para ser recogido.
- **Cancelar:** Cambia el estado a "Cancelado". Notifica al cliente (usando Resend) e indica la razón.
- **Generar Venta POS:** Permite al empleado tomar el pedido confirmado y, al momento de la entrega o envío, llevarlo al Módulo de Ventas (POS) para finalizar la transacción, registrar el pago y emitir el comprobante.

# Módulo de Configuración (Administración del Tenant)

## Configuración de Pedidos/Reservas

Nuevo apartado dentro del módulo.

- **Días Límite de Reserva:** Un campo numérico para definir cuántos días el producto quedará "reservado" (apartado del stock, si aplica) antes de ser cancelado automáticamente si el cliente no lo recoge.
- **Emails de Notificación:** Espacio para personalizar los mensajes que se envían automáticamente al cliente (Confirmación, Cancelación).

# Gestión de Acceso (Roles)

El Rol "Empleado" debe tener acceso al nuevo submódulo de "Pedidos y Reservas".

## Rol "Empleado" (o Vendedor/Almacenero)

- **Ventas (POS):** Para registrar ventas.
- **Compras:** Solo para "Ingreso de Mercadería" (si es Almacenero).
- **Inventario:** Solo para consultar stock (no puede hacer ajustes).
- **Pedidos y Reservas:** Acceso total para Listar, Confirmar, Cancelar y Generar Venta POS.
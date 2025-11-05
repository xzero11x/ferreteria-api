import { z } from 'zod';

// Enums del dominio de Pedidos
export const EstadoPedidoEnum = z.enum(['pendiente', 'confirmado', 'cancelado', 'entregado']);
export const TipoRecojoEnum = z.enum(['tienda', 'envio']);

// Query params para listar pedidos
export const ListPedidosQuerySchema = z.object({
  estado: EstadoPedidoEnum.optional(),
});
export type ListPedidosQueryDTO = z.infer<typeof ListPedidosQuerySchema>;

// Confirmar pedido: mensaje opcional para cliente
export const ConfirmarPedidoSchema = z.object({
  mensaje: z.string().max(500).optional(),
});
export type ConfirmarPedidoDTO = z.infer<typeof ConfirmarPedidoSchema>;

// Cancelar pedido: razón requerida (no se persiste en DB por ahora)
export const CancelarPedidoSchema = z.object({
  razon: z.string().min(3, 'Debe indicar una razón').max(500),
});
export type CancelarPedidoDTO = z.infer<typeof CancelarPedidoSchema>;

// Generar venta desde pedido: método de pago opcional
export const GenerarVentaSchema = z.object({
  metodo_pago: z.string().max(100).optional(),
});
export type GenerarVentaDTO = z.infer<typeof GenerarVentaSchema>;
// O checkout pede só o papel que usa: cobrar. Valores em centavos.
import type { Charges } from './roles.ts';

export type Order = { id: string; total: number };

export function payOrder(order: Order, charges: Charges) {
  if (order.total <= 0) throw new Error('pedido sem valor a cobrar');
  const charge = charges.charge(order.id, order.total);
  return { orderId: order.id, chargeId: charge.id, status: charge.status };
}

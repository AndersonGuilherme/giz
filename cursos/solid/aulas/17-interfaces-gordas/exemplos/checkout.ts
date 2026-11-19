// O checkout recebe o gateway do meio de pagamento escolhido e cobra o pedido. Valores em centavos.
import type { PaymentGateway } from './payment-gateway.ts';

export type Order = { id: string; total: number };

export function payOrder(order: Order, gateway: PaymentGateway) {
  if (order.total <= 0) throw new Error('pedido sem valor a cobrar');
  const charge = gateway.charge(order.id, order.total);
  return { orderId: order.id, chargeId: charge.id, status: charge.status };
}

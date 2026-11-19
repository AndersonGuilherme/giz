import type { Payment } from './payment.ts';

// Código NOVO: devolução de produto. Estorna e marca o pedido como reembolsado.
export function returnProduct(payment: Payment, value: number, now: Date) {
  payment.refund(value, now);
  return { status: 'reembolsado', refunded: payment.refunded };
}

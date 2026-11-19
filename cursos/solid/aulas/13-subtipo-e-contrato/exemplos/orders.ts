import type { Payment } from './payment.ts';

// Fluxo do pedido, escrito para QUALQUER Payment.
export function placeOrder(payment: Payment) {
  payment.authorize(); // só reserva
}

export function shipOrder(payment: Payment) {
  payment.capture(); // agora cobra
}

export function cancelOrder(payment: Payment) {
  // Antes do envio, nada foi cobrado: a reserva simplesmente expira.
  if (payment.status === 'captured') payment.refund(payment.charged);
}

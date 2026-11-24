import type { Payment } from './payment.ts';

export function shipOrder(payment: Payment, now: Date) {
  payment.capture?.capture(now); // quem não tem duas etapas já está pago
}

export function cancelOrder(payment: Payment, now: Date) {
  if (payment.capture && !payment.capture.capturedAt) return 'reserva liberada';
  const r = payment.refunds;
  if (r?.canRefund(payment.amount - r.refunded, now)) {
    r.refund(payment.amount - r.refunded, now);
    return 'estornado';
  }
  return 'crédito na loja';
}

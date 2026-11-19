import type { Payment } from './payment.ts';
import { PixPayment, GiftCardPayment, daysSince } from './methods.ts';

export function refundFromSupport(payment: Payment, value: number, now: Date) {
  if (payment instanceof GiftCardPayment) return 'Abrir chamado no financeiro';
  if (payment instanceof PixPayment && daysSince(payment.capturedAt!, now) > 90)
    return 'Pix vencido: oferecer crédito na loja';
  payment.refund(value, now);
  return `Estornado: R$ ${(payment.refunded / 100).toFixed(2).replace('.', ',')}`;
}

import type { Payment } from './payment.ts';

// Tela do atendimento: estorna e mostra quanto já foi devolvido.
// Escrita para QUALQUER Payment, confiando no contrato da base.
export function refundFromSupport(payment: Payment, value: number, now: Date) {
  payment.refund(value, now);
  return `Estornado: R$ ${(payment.refunded / 100).toFixed(2).replace('.', ',')}`;
}

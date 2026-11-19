import type { Payment } from './payment.ts';

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export function refundFromSupport(payment: Payment, value: number, now: Date) {
  const r = payment.refunds;
  if (!r) return 'Sem estorno: oferecer crédito na loja';
  if (!r.canRefund(value, now)) return 'Fora do contrato: oferecer crédito na loja';
  r.refund(value, now);
  return `Estornado: ${brl(r.refunded)}`;
}

export const refundPolicy = (payment: Payment) =>
  payment.refunds?.policy ?? 'Sem estorno: crédito na loja';

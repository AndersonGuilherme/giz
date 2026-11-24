import type { Payment } from './payment.ts';

// Texto do comprovante: quanto tempo o cliente tem para pedir estorno.
export function refundPolicy(payment: Payment) {
  switch (payment.constructor.name) {
    case 'PixPayment': return 'Estorno em até 90 dias';
    case 'GiftCardPayment': return 'Estorno pelo atendimento';
    default: return 'Estorno a qualquer momento';
  }
}

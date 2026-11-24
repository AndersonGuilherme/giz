import { Payment } from './payment.ts';

export const daysSince = (from: Date, now: Date) => (now.getTime() - from.getTime()) / 86_400_000;

export class PixPayment extends Payment {
  refund(value: number, now: Date) {
    if (daysSince(this.capturedAt!, now) > 90) throw new Error('Pix: prazo de 90 dias expirado');
    super.refund(value, now);
  }
}

export class BoletoPayment extends Payment {
  capture(now: Date) {
    throw new Error('boleto não suporta captura');
  }
}

export class GiftCardPayment extends Payment {
  refund(value: number, now: Date) {
    // cartão-presente: o estorno é feito à mão pelo financeiro
  }
}

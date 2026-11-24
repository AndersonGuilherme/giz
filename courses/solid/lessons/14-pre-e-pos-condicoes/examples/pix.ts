import { Payment } from './payment.ts';

const DAY = 24 * 60 * 60 * 1000;

export class PixPayment extends Payment {
  refund(value: number, now: Date) {
    // Regra do Pix: a devolução só pode ser feita em até 90 dias.
    const days = (now.getTime() - this.capturedAt!.getTime()) / DAY;
    if (days > 90) throw new Error('Pix: prazo de 90 dias expirado');
    super.refund(value, now);
  }
}

import type { Capturable, Refundable } from './payment.ts';

const DAY = 24 * 60 * 60 * 1000;

// Peças reaproveitáveis: cada forma de pagamento monta as que precisa.
export class TwoStepCapture implements Capturable {
  capturedAt: Date | null = null;
  capture(now: Date) { this.capturedAt ??= now; }
}

type RefundOptions = {
  paidAt: () => Date | null;      // desde quando conta o prazo
  windowDays?: number;            // sem prazo se ausente
  payout: (value: number) => void; // como o dinheiro volta
};

export class RefundLedger implements Refundable {
  refunded = 0;
  readonly amount: number;
  readonly options: RefundOptions;
  constructor(amount: number, options: RefundOptions) { this.amount = amount; this.options = options; }

  get policy() {
    const days = this.options.windowDays;
    return days ? `Estorno em até ${days} dias` : 'Estorno a qualquer momento';
  }

  canRefund(value: number, now: Date) {
    const paidAt = this.options.paidAt();
    if (!paidAt || value <= 0 || value > this.amount - this.refunded) return false;
    const days = this.options.windowDays;
    return !days || (now.getTime() - paidAt.getTime()) / DAY <= days;
  }

  refund(value: number, now: Date) {
    if (!this.canRefund(value, now)) throw new Error('estorno fora do contrato');
    this.refunded += value;
    this.options.payout(value);
  }
}

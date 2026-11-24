// Pagamentos da loja. Valores em centavos.
// CONTRATO de refund(value, now), o que todo cliente de Payment pode assumir:
//   pré:        o pagamento foi capturado e 0 < value <= amount - refunded
//   pós:        refunded aumenta exatamente value
//   invariante: 0 <= refunded <= amount, sempre
export class Payment {
  readonly amount: number;
  status: 'new' | 'authorized' | 'captured' = 'new';
  capturedAt: Date | null = null;
  refunded = 0;
  constructor(amount: number) { this.amount = amount; }

  authorize() { this.status = 'authorized'; }
  capture(now: Date) { this.status = 'captured'; this.capturedAt = now; }

  refund(value: number, now: Date) {
    if (this.status !== 'captured') throw new Error('pagamento não capturado');
    if (value <= 0 || value > this.amount - this.refunded) throw new Error('valor inválido');
    this.refunded += value;
  }
}

export class CreditCardPayment extends Payment {}

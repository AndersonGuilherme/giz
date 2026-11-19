// Pagamentos da loja depois de alguns "consertos rápidos". Valores em centavos.
export class Payment {
  readonly amount: number;
  status: 'new' | 'authorized' | 'captured' = 'new';
  capturedAt: Date | null = null;
  refunded = 0;
  constructor(amount: number) { this.amount = amount; }

  authorize() { this.status = 'authorized'; }

  // ATENÇÃO: não chame capture() em boleto. Quem confirma boleto é o banco.
  capture(now: Date) { this.status = 'captured'; this.capturedAt = now; }

  // ATENÇÃO: Pix só estorna em até 90 dias. Confira antes de chamar.
  refund(value: number, now: Date) {
    if (value <= 0 || value > this.amount - this.refunded) throw new Error('valor inválido');
    this.refunded += value;
  }
}

export class CreditCardPayment extends Payment {}

import { Payment } from './payment.ts';

export type GiftCard = { code: string; balance: number };

export class GiftCardPayment extends Payment {
  readonly card: GiftCard;
  constructor(amount: number, card: GiftCard) { super(amount); this.card = card; }

  // "Cartão-presente não tem reserva": debita o saldo já na autorização.
  authorize() {
    this.card.balance -= this.amount;
    this.status = 'authorized';
  }
  capture() { this.status = 'captured'; this.charged = this.amount; }
  refund(value: number) { this.refunded += value; this.card.balance += value; }
}

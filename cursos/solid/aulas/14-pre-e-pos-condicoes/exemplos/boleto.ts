import { Payment } from './payment.ts';

export class BoletoPayment extends Payment {
  readonly transfers: number[] = []; // transferências agendadas para o cliente

  // Boleto não volta pelo banco: o estorno é uma transferência,
  // feita em até 3 dias úteis. Então aqui só agenda.
  refund(value: number, now: Date) {
    this.transfers.push(value);
  }
}

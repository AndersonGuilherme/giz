// Pagamentos da loja. Valores em centavos.
// O CONTRATO de Payment (o que todo código que recebe um Payment espera):
//   authorize(): reserva o valor. Nenhum dinheiro sai do cliente ainda.
//   capture():   cobra o valor reservado (feito quando o pedido é enviado).
//   refund(v):   devolve v do que foi cobrado.
export type Status = 'new' | 'authorized' | 'captured';

export class Payment {
  readonly amount: number;
  status: Status = 'new';
  charged = 0; // quanto já saiu do bolso do cliente
  refunded = 0;
  constructor(amount: number) { this.amount = amount; }

  authorize() { this.status = 'authorized'; }
  capture() { this.status = 'captured'; this.charged = this.amount; }
  refund(value: number) { this.refunded += value; }
}

export class CreditCardPayment extends Payment {}

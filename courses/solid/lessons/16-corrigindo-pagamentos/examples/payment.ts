// Pagamentos da loja, por CAPACIDADE. Valores em centavos.
// Payment: só o que TODO pagamento cumpre. O resto é opcional e está no tipo.
export interface Payment {
  readonly method: string;
  readonly amount: number;
  readonly capture?: Capturable; // só quem cobra em duas etapas (reserva, depois cobra)
  readonly refunds?: Refundable; // só quem devolve o dinheiro por conta própria
}

// Capturable: capture() cobra o valor reservado. Nunca "não suportado".
export interface Capturable {
  readonly capturedAt: Date | null;
  capture(now: Date): void;
}

// Refundable:
//   pré:        canRefund(value, now) é true (o prazo está no contrato, à vista)
//   pós:        refunded sobe exatamente value
//   invariante: 0 <= refunded <= amount
export interface Refundable {
  readonly refunded: number;
  readonly policy: string;
  canRefund(value: number, now: Date): boolean;
  refund(value: number, now: Date): void;
}

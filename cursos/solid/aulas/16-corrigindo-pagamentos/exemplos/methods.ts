import type { Payment } from './payment.ts';
import { TwoStepCapture, RefundLedger } from './capabilities.ts';

export type Ledger = { payouts: string[] }; // o que saiu para o cliente, para os testes verem

export function creditCard(amount: number, ledger: Ledger): Payment {
  const capture = new TwoStepCapture();
  const refunds = new RefundLedger(amount, {
    paidAt: () => capture.capturedAt,
    payout: (v) => ledger.payouts.push(`cartão: ${v}`),
  });
  return { method: 'cartão', amount, capture, refunds };
}

export function pix(amount: number, paidAt: Date, ledger: Ledger): Payment {
  const refunds = new RefundLedger(amount, {
    paidAt: () => paidAt,
    windowDays: 90, // regra do Pix, agora no contrato
    payout: (v) => ledger.payouts.push(`pix: ${v}`),
  });
  return { method: 'pix', amount, refunds };
}

export function boleto(amount: number, paidAt: Date, ledger: Ledger): Payment {
  const refunds = new RefundLedger(amount, {
    paidAt: () => paidAt,
    payout: (v) => ledger.payouts.push(`transferência agendada: ${v}`),
  });
  return { method: 'boleto', amount, refunds };
}

// Cartão-presente: debita o saldo na hora e não devolve dinheiro.
export function giftCard(amount: number, card: { balance: number }): Payment {
  card.balance -= amount;
  return { method: 'cartão-presente', amount };
}

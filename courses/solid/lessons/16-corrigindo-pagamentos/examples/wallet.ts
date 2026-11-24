import type { Payment } from './payment.ts';
import type { Ledger } from './methods.ts';
import { TwoStepCapture, RefundLedger } from './capabilities.ts';

// Pagamento novo: carteira digital. Reserva, cobra no envio, estorna em até 180 dias.
// Nenhum outro arquivo da loja mudou.
export function digitalWallet(amount: number, ledger: Ledger): Payment {
  const capture = new TwoStepCapture();
  const refunds = new RefundLedger(amount, {
    paidAt: () => capture.capturedAt,
    windowDays: 180,
    payout: (v) => ledger.payouts.push(`carteira: ${v}`),
  });
  return { method: 'carteira digital', amount, capture, refunds };
}

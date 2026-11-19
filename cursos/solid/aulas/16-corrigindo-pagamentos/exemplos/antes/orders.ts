import type { Payment } from './payment.ts';
import { BoletoPayment } from './methods.ts';

export function shipOrder(payment: Payment, now: Date) {
  if (!(payment instanceof BoletoPayment)) payment.capture(now);
}

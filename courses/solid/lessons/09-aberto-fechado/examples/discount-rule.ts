// O ponto de extensão: o que toda regra de desconto sabe responder.
import type { Customer } from './price-calculator.ts';

export type DiscountContext = { subtotal: number; customer: Customer; now: Date };

export interface DiscountRule {
  rate(ctx: DiscountContext): number; // 0.1 = 10%; 0 = não se aplica
}

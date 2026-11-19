// A parte estável: o que vale para TODA promoção.
// Não acumula (vale o maior) · nunca passa do subtotal · empate fica com a primeira da lista.
import type { DiscountContext, DiscountRule } from './discount-rule.ts';

export type Discount = { name: string; amount: number };

export class PriceCalculator {
  private readonly rules: DiscountRule[];
  constructor(rules: DiscountRule[]) {
    this.rules = rules;
  }

  bestDiscount(ctx: DiscountContext): Discount {
    let best: Discount = { name: 'nenhum', amount: 0 };
    for (const rule of this.rules) {
      // nunca passa do subtotal
      const amount = Math.min(rule.amount(ctx), ctx.subtotal);
      // não acumula: vale o maior (empate fica com a primeira)
      if (amount > best.amount) best = { name: rule.name, amount };
    }
    return best;
  }
}

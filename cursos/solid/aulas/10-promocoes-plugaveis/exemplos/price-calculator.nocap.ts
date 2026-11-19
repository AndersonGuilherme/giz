// Primeira versão da calculadora plugável: pergunta a cada regra e fica com a maior.
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
      const amount = rule.amount(ctx);
      // não acumula: vale o maior (empate fica com a primeira)
      if (amount > best.amount) best = { name: rule.name, amount };
    }
    return best;
  }
}

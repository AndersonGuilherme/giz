// A parte estável fica aqui: somar, escolher o maior desconto, arredondar.
// A parte que muda (quais promoções existem) chega de fora, numa lista.
import type { Item } from './price-calculator.ts';
import type { DiscountContext, DiscountRule } from './discount-rule.ts';

export class PriceCalculator {
  private readonly rules: DiscountRule[];
  constructor(rules: DiscountRule[]) {
    this.rules = rules;
  }

  subtotal(items: Item[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  discount(ctx: DiscountContext): number {
    const rates = this.rules.map((rule) => rule.rate(ctx));
    const best = Math.max(0, ...rates); // não acumula: vale o maior
    return Math.round(ctx.subtotal * best);
  }
}

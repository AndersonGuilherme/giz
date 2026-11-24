// Pedido do marketing: 15% no mês do aniversário do cliente (não acumula: vale o maior).
// A mudança "óbvia": mais um else if no método que já funcionava.
import { isBlackFriday } from './infra.ts';
import type { Customer, Item } from './price-calculator.ts';

export class PriceCalculator {
  subtotal(items: Item[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  discount(subtotal: number, customer: Customer, now: Date): number {
    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    else if (customer.birthMonth === now.getMonth() + 1) rate = 0.15;
    if (isBlackFriday(now)) rate = Math.max(rate, 0.2); // vale o maior
    return Math.round(subtotal * rate);
  }
}

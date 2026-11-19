// Versão A depois do pedido "Black Friday passa a 35%": uma linha, um arquivo.
import { isBlackFriday } from '../infra.ts';
import type { Item, Customer } from '../types.ts';

export class PriceCalculator {
  quote(items: Item[], customer: Customer, now: Date) {
    let subtotal = 0;
    for (const item of items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now) && rate < 0.35) rate = 0.35;
    return { subtotal, discount: Math.round(subtotal * rate) };
  }
}

// Ator: FINANCEIRO. As linhas de soma e desconto, movidas sem mudar nada.
import { isBlackFriday } from './infra.ts';
import type { Item, Customer } from './types.ts';

export class PriceCalculator {
  quote(items: Item[], customer: Customer, now: Date) {
    let subtotal = 0;
    for (const item of items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now) && rate < 0.2) rate = 0.2;
    return { subtotal, discount: Math.round(subtotal * rate) };
  }
}

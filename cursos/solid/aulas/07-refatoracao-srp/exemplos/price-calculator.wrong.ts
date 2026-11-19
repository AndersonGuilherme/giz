// A primeira tentativa do passo 1: o método novo não recebeu a data... e a Black Friday ficou para trás.
import type { Item, Customer } from './types.ts';

export class PriceCalculator {
  quote(items: Item[], customer: Customer) {
    let subtotal = 0;
    for (const item of items) subtotal += item.price * item.quantity;

    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    return { subtotal, discount: Math.round(subtotal * rate) };
  }
}

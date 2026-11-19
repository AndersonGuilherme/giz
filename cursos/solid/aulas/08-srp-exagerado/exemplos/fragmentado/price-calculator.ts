// Versão B: sete classes "de uma coisa só". Esta monta as outras seis.
import { SubtotalCalculator } from './subtotal-calculator.ts';
import { VipDiscount } from './vip-discount.ts';
import { EmployeeDiscount } from './employee-discount.ts';
import { BlackFridayDiscount } from './black-friday-discount.ts';
import { RateSum } from './rate-sum.ts';
import { DiscountApplier } from './discount-applier.ts';
import type { Item, Customer } from '../types.ts';

export class PriceCalculator {
  quote(items: Item[], customer: Customer, now: Date) {
    const subtotal = new SubtotalCalculator().sum(items);
    const rate = new RateSum().total([
      new VipDiscount().rate(customer, now),
      new EmployeeDiscount().rate(customer),
      new BlackFridayDiscount().rate(customer, now),
    ]);
    return { subtotal, discount: new DiscountApplier().apply(subtotal, rate) };
  }
}

// Versão B depois do pedido "Black Friday passa a 35%": só o arquivo da Black Friday mudou.
import { SubtotalCalculator } from '../fragmentado/subtotal-calculator.ts';
import { VipDiscount } from '../fragmentado/vip-discount.ts';
import { EmployeeDiscount } from '../fragmentado/employee-discount.ts';
import { BlackFridayDiscount } from './black-friday-discount.ts';
import { RateSum } from '../fragmentado/rate-sum.ts';
import { DiscountApplier } from '../fragmentado/discount-applier.ts';
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

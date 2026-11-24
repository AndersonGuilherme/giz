// A ideia "estender por herança" (a versão original do princípio, Bertrand Meyer, 1988):
// não edita a classe-mãe, cria uma filha que acrescenta o aniversário.
import { PriceCalculator, type Customer } from './price-calculator.ts';

export class BirthdayPriceCalculator extends PriceCalculator {
  override discount(subtotal: number, customer: Customer, now: Date): number {
    const base = super.discount(subtotal, customer, now);
    const isBirthday = customer.birthMonth === now.getMonth() + 1;
    const birthday = isBirthday ? Math.round(subtotal * 0.15) : 0;
    return Math.max(base, birthday); // vale o maior
  }
}

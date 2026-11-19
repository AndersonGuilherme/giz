// Estado no fim do módulo SRP: o PriceCalculator só cuida de dinheiro (ator: financeiro).
// Regras da loja: VIP 10% · funcionário 30% · Black Friday 20% para todos.
// Não acumula: vale o maior desconto. Valores em centavos.
import { isBlackFriday } from './infra.ts';

export type Customer = { type: 'regular' | 'vip' | 'employee'; birthMonth: number };
export type Item = { price: number; quantity: number };

export class PriceCalculator {
  subtotal(items: Item[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  discount(subtotal: number, customer: Customer, now: Date): number {
    let rate = 0;
    if (customer.type === 'vip') rate = 0.1;
    else if (customer.type === 'employee') rate = 0.3;
    if (isBlackFriday(now)) rate = Math.max(rate, 0.2); // vale o maior
    return Math.round(subtotal * rate);
  }
}

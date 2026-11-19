// Passo 2 · OCP — descontos plugáveis. Promoção nova = regra nova na lista; priceOf não muda.
// Regra da loja: os descontos NÃO acumulam, vale o maior.
export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number }; // centavos
export type DiscountRule = (customer: Customer, now: Date) => number; // taxa: 0.1 = 10%

const isBlackFriday = (d: Date) => d.getMonth() === 10 && d.getDate() >= 24 && d.getDate() <= 30;
export const vip: DiscountRule = (c) => (c.type === 'vip' ? 0.1 : 0);
export const employee: DiscountRule = (c) => (c.type === 'employee' ? 0.3 : 0);
export const blackFriday: DiscountRule = (_, now) => (isBlackFriday(now) ? 0.2 : 0);
export const storeRules: DiscountRule[] = [vip, employee, blackFriday];

export function priceOf(items: Item[], customer: Customer, now: Date, rules = storeRules) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const rate = Math.max(0, ...rules.map((rule) => rule(customer, now))); // vale o maior
  const total = Math.round(subtotal * (1 - rate));
  return { subtotal, total, saved: subtotal - total };
}

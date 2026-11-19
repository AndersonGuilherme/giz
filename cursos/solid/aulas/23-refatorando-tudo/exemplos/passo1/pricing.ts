// Passo 1 · SRP — financeiro: subtotal, desconto e economia. Não sabe de frete, banco nem e-mail.
export type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Item = { price: number; quantity: number }; // centavos

export function isBlackFriday(date: Date): boolean {
  return date.getMonth() === 10 && date.getDate() >= 24 && date.getDate() <= 30;
}

export function priceOf(items: Item[], customer: Customer, now: Date) {
  let subtotal = 0;
  for (const item of items) subtotal += item.price * item.quantity;

  let rate = 0;
  if (customer.type === 'vip') rate = 0.1;
  else if (customer.type === 'employee') rate = 0.3;
  if (isBlackFriday(now) && rate < 0.2) rate = 0.2;
  const total = Math.round(subtotal * (1 - rate));
  return { subtotal, total, saved: subtotal - total };
}

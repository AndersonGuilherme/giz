// Política: regras de preço (do módulo SRP). Valores em centavos.
export type Item = { price: number; quantity: number };
export type CustomerKind = 'regular' | 'vip' | 'employee';

export function subtotalOf(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Black Friday: a última sexta-feira de novembro.
export function isBlackFriday(now: Date): boolean {
  return now.getUTCMonth() === 10 && now.getUTCDay() === 5 && now.getUTCDate() >= 24;
}

// VIP 10% · funcionário 30% · Black Friday 20% para todos. Não acumula: vale o maior.
export function discountFor(kind: CustomerKind, subtotal: number, now: Date): number {
  const rates = [0];
  if (kind === 'vip') rates.push(0.1);
  if (kind === 'employee') rates.push(0.3);
  if (isBlackFriday(now)) rates.push(0.2);
  return Math.round(subtotal * Math.max(...rates));
}

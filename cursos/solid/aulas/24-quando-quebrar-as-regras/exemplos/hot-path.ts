// Desempenho: recalcular o preço de 1 milhão de itens do catálogo (ex.: virada da Black Friday).
// Três versões com o MESMO resultado. Regra da loja: descontos não acumulam, vale o maior.
export type Customer = { type: 'regular' | 'vip' | 'employee' };
export type DiscountRule = (customer: Customer, blackFriday: boolean) => number;

export const rules: DiscountRule[] = [
  (c) => (c.type === 'vip' ? 0.1 : 0),
  (c) => (c.type === 'employee' ? 0.3 : 0),
  (_, bf) => (bf ? 0.2 : 0),
];

// 1) Regras plugáveis, perguntadas a CADA item (como no checkout, que tem 3 itens, não 1 milhão).
export function rulesPerItem(prices: Int32Array, customer: Customer, bf: boolean): number {
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    const rate = Math.max(0, ...rules.map((rule) => rule(customer, bf)));
    sum += Math.round(prices[i] * (1 - rate));
  }
  return sum;
}

// 2) As MESMAS regras plugáveis, perguntadas uma vez, na borda. O miolo do laço fica direto.
export function rulesOnce(prices: Int32Array, customer: Customer, bf: boolean): number {
  const rate = Math.max(0, ...rules.map((rule) => rule(customer, bf)));
  let sum = 0;
  for (let i = 0; i < prices.length; i++) sum += Math.round(prices[i] * (1 - rate));
  return sum;
}

// 3) Tudo escrito à mão, sem regra plugável nenhuma.
export function handWritten(prices: Int32Array, customer: Customer, bf: boolean): number {
  let rate = bf ? 0.2 : 0;
  if (customer.type === 'vip') rate = Math.max(rate, 0.1);
  if (customer.type === 'employee') rate = Math.max(rate, 0.3);
  let sum = 0;
  for (let i = 0; i < prices.length; i++) sum += Math.round(prices[i] * (1 - rate));
  return sum;
}

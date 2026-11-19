// Arquivo novo: Dia das Mães (domingo, 10/05/2026). 15% para todos, de 4 a 10 de maio.
import type { DiscountRule } from './discount-rule.ts';

const start = new Date(2026, 4, 4);
const end = new Date(2026, 4, 11); // até o fim do dia 10

export const mothersDay: DiscountRule = {
  name: 'Dia das Mães',
  amount: ({ subtotal, now }) =>
    now >= start && now < end ? Math.round(subtotal * 0.15) : 0,
};

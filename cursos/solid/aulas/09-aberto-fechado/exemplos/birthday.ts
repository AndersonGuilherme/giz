// Arquivo novo: 15% no mês do aniversário. Nenhuma linha da calculadora mudou.
import type { DiscountRule } from './discount-rule.ts';

export const birthday: DiscountRule = {
  rate: ({ customer, now }) =>
    customer.birthMonth === now.getMonth() + 1 ? 0.15 : 0,
};

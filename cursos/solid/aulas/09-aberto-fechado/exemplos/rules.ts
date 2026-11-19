// As regras que já existiam, cada uma no seu canto.
import { isBlackFriday } from './infra.ts';
import type { DiscountRule } from './discount-rule.ts';

export const vip: DiscountRule = {
  rate: ({ customer }) => (customer.type === 'vip' ? 0.1 : 0),
};

export const employee: DiscountRule = {
  rate: ({ customer }) => (customer.type === 'employee' ? 0.3 : 0),
};

export const blackFriday: DiscountRule = {
  rate: ({ now }) => (isBlackFriday(now) ? 0.2 : 0),
};

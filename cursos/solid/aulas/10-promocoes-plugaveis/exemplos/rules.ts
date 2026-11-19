// As regras da loja. Cada uma decide sozinha se vale e quanto desconta.
import { isBlackFriday } from './infra.ts';
import type { DiscountRule } from './discount-rule.ts';

const percent = (subtotal: number, rate: number) => Math.round(subtotal * rate);

export const vip: DiscountRule = {
  name: 'VIP',
  amount: ({ subtotal, customer }) =>
    customer.type === 'vip' ? percent(subtotal, 0.1) : 0,
};

export const employee: DiscountRule = {
  name: 'Funcionário',
  amount: ({ subtotal, customer }) =>
    customer.type === 'employee' ? percent(subtotal, 0.3) : 0,
};

export const blackFriday: DiscountRule = {
  name: 'Black Friday',
  amount: ({ subtotal, now }) => (isBlackFriday(now) ? percent(subtotal, 0.2) : 0),
};

// Cupom: valor fixo. O código e o valor entram de fora.
export function coupon(code: string, cents: number): DiscountRule {
  return { name: `Cupom ${code}`, amount: (ctx) => (ctx.coupon === code ? cents : 0) };
}

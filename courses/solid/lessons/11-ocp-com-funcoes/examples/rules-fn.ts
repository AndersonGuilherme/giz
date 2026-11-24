// OCP sem classe: o contrato é o formato de uma função.
import { isBlackFriday, isoDay } from './infra.ts';
import type { DiscountContext } from './context.ts';

export type Rule = (ctx: DiscountContext) => number; // centavos
export type Condition = (ctx: DiscountContext) => boolean;

// Ordem superior: recebem a configuração, devolvem uma regra.
export const percentOff = (rate: number, when: Condition): Rule =>
  (ctx) => (when(ctx) ? Math.round(ctx.subtotal * rate) : 0);

export const fixedOff = (cents: number, when: Condition): Rule =>
  (ctx) => (when(ctx) ? cents : 0);

// Condições: funções pequenas que respondem sim ou não.
export const isVip: Condition = ({ customer }) => customer.type === 'vip';
export const isEmployee: Condition = ({ customer }) => customer.type === 'employee';
export const onBlackFriday: Condition = ({ now }) => isBlackFriday(now);
export const couponIs = (code: string): Condition => (ctx) => ctx.coupon === code;
export const between = (from: string, to: string): Condition =>
  ({ now }) => isoDay(now) >= from && isoDay(now) <= to;

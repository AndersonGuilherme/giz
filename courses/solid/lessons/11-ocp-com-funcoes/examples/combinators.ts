// A política também vira função: recebe regras e devolve uma regra.
import type { Rule } from './rules-fn.ts';

// Não acumula: vale o maior.
export const bestOf = (...rules: Rule[]): Rule =>
  (ctx) => Math.max(0, ...rules.map((rule) => rule(ctx)));

// Acumula: soma tudo.
export const sumOf = (...rules: Rule[]): Rule =>
  (ctx) => rules.reduce((total, rule) => total + rule(ctx), 0);

// Nunca passa do subtotal.
export const capped = (rule: Rule): Rule =>
  (ctx) => Math.min(rule(ctx), ctx.subtotal);

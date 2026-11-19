// O intérprete: cada linha da tabela vira uma regra, usando as mesmas fábricas.
import { percentOff, fixedOff, couponIs, between, type Rule, type Condition } from './rules-fn.ts';
import { bestOf, capped } from './combinators.ts';

export type PromoRow = {
  name: string;
  percent?: number;
  fixed?: number;
  customer?: 'vip' | 'employee';
  coupon?: string;
  from?: string;
  to?: string;
};

export function fromConfig(rows: PromoRow[]): Rule {
  return capped(bestOf(...rows.map(toRule)));
}

function toRule(row: PromoRow): Rule {
  validate(row);
  const when: Condition[] = [];
  if (row.customer) when.push(({ customer }) => customer.type === row.customer);
  if (row.coupon) when.push(couponIs(row.coupon));
  if (row.from && row.to) when.push(between(row.from, row.to));
  const all: Condition = (ctx) => when.every((c) => c(ctx));
  return row.percent !== undefined
    ? percentOff(row.percent / 100, all)
    : fixedOff(row.fixed ?? 0, all);
}

// Dado vira código sem passar pelo compilador: validar é obrigatório.
export function validate(row: PromoRow): void {
  const { name, percent, fixed } = row;
  if ((percent === undefined) === (fixed === undefined))
    throw new Error(`${name}: use percent OU fixed`);
  if (percent !== undefined && (percent <= 0 || percent > 100))
    throw new Error(`${name}: percent ${percent} fora de 1 a 100`);
  if (fixed !== undefined && (!Number.isInteger(fixed) || fixed <= 0))
    throw new Error(`${name}: fixed precisa ser centavos > 0`);
}

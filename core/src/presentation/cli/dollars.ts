import type { CostEstimate } from '../../domain/ai/CostEstimate.ts';

/** A cost for the CLI: `US$ 0,05` (pt-BR digits), or `desconhecido` for a model without a known price. */
export function dollars(cost: CostEstimate): string {
  const value = cost.dollars();
  return value === undefined ? 'desconhecido' : `US$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

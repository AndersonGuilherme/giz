// O único plugin que existe: 5% sobre tudo (alíquota fictícia, para fins didáticos).
import type { TaxPlugin } from './tax-plugin.ts';

export const defaultTaxPlugin: TaxPlugin = {
  id: 'default',
  priority: 0,
  appliesTo: () => true,
  rate: () => 0.05,
};

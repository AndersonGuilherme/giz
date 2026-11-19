// O único plugin que existe, agora por estado de destino (alíquotas fictícias, para fins didáticos).
import type { TaxPlugin } from './tax-plugin.ts';

const RATE_BY_STATE: Record<string, number> = { SP: 0.07, RJ: 0.08 };

export const defaultTaxPlugin: TaxPlugin = {
  id: 'default',
  priority: 0,
  appliesTo: () => true,
  rate: ({ state }) => RATE_BY_STATE[state] ?? 0.05,
};

// Imposto estimado na nota, por estado de destino (alíquotas fictícias, para fins didáticos).
const RATE_BY_STATE: Record<string, number> = { SP: 0.07, RJ: 0.08 };
const DEFAULT_RATE = 0.05;

export function taxFor(amount: number, state: string): number {
  return Math.round(amount * (RATE_BY_STATE[state] ?? DEFAULT_RATE));
}

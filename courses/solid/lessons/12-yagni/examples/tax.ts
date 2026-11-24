// Imposto estimado na nota: 5% do valor (alíquota fictícia, para fins didáticos).
const TAX_RATE = 0.05;

export function taxFor(amount: number): number {
  return Math.round(amount * TAX_RATE);
}

// Helper "genérico" de dinheiro: arredonda ao centavo. Usado pelo checkout.
export function roundMoney(cents: number): number {
  return Math.round(cents);
}

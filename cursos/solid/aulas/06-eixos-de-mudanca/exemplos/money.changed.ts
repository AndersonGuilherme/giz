// Helper "genérico" de dinheiro: arredonda ao centavo. Usado pelo checkout.
export function roundMoney(cents: number): number {
  return Math.round(cents / 100) * 100; // e-mail: economia em reais redondos
}

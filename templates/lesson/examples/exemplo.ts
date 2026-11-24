// Código que aparece na tela. Precisa rodar de verdade e ter teste (exemplo.test.ts).
export function precoFinal(subtotal: number, cupom?: string): number {
  if (cupom === 'BEMVINDO') return subtotal - 10;
  return subtotal;
}

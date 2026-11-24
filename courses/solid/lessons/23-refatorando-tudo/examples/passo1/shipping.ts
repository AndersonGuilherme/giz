// Passo 1 · SRP — logística: a regra de frete sozinha (como na aula 02). Não importa nada.
// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
export type ShippingMethod = 'standard' | 'pickup' | 'express';

export function shippingFor(method: ShippingMethod, subtotal: number): number {
  if (method === 'pickup') return 0;
  if (method === 'express') return 3500;
  return subtotal >= 20000 ? 0 : 2000;
}
